# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
from dataclasses import dataclass
import json
import time
import hashlib

SCHEMA_VERSION = "FIDUCIA_SANITISED_V1"
DEFAULT_REVIEW_FEE_WEI = 0  # admin can update with set_review_fee(new_fee) after deployment


# ─── Storage dataclasses ──────────────────────────────────────────────────────

@allow_storage
@dataclass
class CreditCase:
    borrower: str
    business_name: str
    business_type: str
    loan_amount: u256
    loan_duration_months: u256
    loan_purpose: str
    business_age_months: u256
    evidence_commitment: str
    status: str
    created_at: u256
    updated_at: u256


@allow_storage
@dataclass
class CaseVerdict:
    credit_score: u256
    risk_level: str
    decision: str
    confidence: u256
    repayment_probability: u256
    reasoning: str        # JSON-encoded list[str]
    risk_flags: str       # JSON-encoded list[str]
    positive_signals: str # JSON-encoded list[str]
    max_loan_amount: u256
    interest_rate_bps: u256   # basis points, e.g. 1500 = 15%
    loan_duration_months: u256
    conditions: str       # JSON-encoded list[str]


@allow_storage
@dataclass
class AppealVerdict:
    appeal_outcome: str
    revised_credit_score: u256
    revised_risk_level: str
    revised_decision: str
    confidence: u256
    reasoning: str        # JSON-encoded list[str]
    max_loan_amount: u256
    interest_rate_bps: u256
    loan_duration_months: u256


@allow_storage
@dataclass
class BorrowerReputation:
    total_reviewed: u256
    approved: u256
    conditional: u256
    rejected: u256
    average_score: u256
    last_risk_level: str
    last_decision: str
    last_case_id: str


# ─── Contract ─────────────────────────────────────────────────────────────────

class FiduciaProtocol(gl.Contract):
    cases:             TreeMap[str, CreditCase]
    case_evidence:     TreeMap[str, str]     # case_id → revealed evidence JSON
    verdicts:          TreeMap[str, CaseVerdict]
    appeal_evidence:   TreeMap[str, str]     # case_id → appeal JSON (+ "_commitment" suffix for commitment)
    appeal_verdicts:   TreeMap[str, AppealVerdict]
    reputation:        TreeMap[str, BorrowerReputation]  # lower-case address → rep
    borrower_case_ids: TreeMap[str, str]     # lower-case address → JSON list[str]
    reviewed_case_ids: str                   # JSON list[str] of all reviewed case IDs
    case_counter:      u256
    review_fee:        u256                  # minimum fee in wei
    admin:             str                   # hex address of admin
    paused:            bool

    def __init__(self) -> None:
        self.case_counter      = u256(0)
        self.review_fee        = u256(DEFAULT_REVIEW_FEE_WEI)
        self.admin             = str(gl.message.sender_address)
        self.paused            = False
        self.reviewed_case_ids = "[]"

    # ─── private helpers ──────────────────────────────────────────────────────

    def _require_admin(self) -> None:
        if str(gl.message.sender_address).lower() != self.admin.lower():
            raise gl.UserError("Not admin")

    def _require_not_paused(self) -> None:
        if self.paused:
            raise gl.UserError("Protocol paused")

    def _next_case_id(self) -> str:
        self.case_counter = u256(int(self.case_counter) + 1)
        return str(int(self.case_counter))

    def _get_borrower_ids(self, addr: str) -> list:
        return json.loads(self.borrower_case_ids.get(addr.lower(), "[]"))

    def _set_borrower_ids(self, addr: str, ids: list) -> None:
        self.borrower_case_ids[addr.lower()] = json.dumps(ids)

    def _now(self) -> u256:
        return u256(int(time.time()))

    def _verify_commitment(self, data_json: str, salt: str, commitment: str) -> None:
        raw    = (data_json + salt).encode()
        digest = "0x" + hashlib.sha256(raw).hexdigest()
        if digest != commitment:
            raise gl.UserError("Commitment mismatch")

    def _update_reputation(
        self, borrower: str, score: int, risk: str, decision: str, case_id: str
    ) -> None:
        key      = borrower.lower()
        existing = self.reputation.get(key, None)
        if existing is None:
            self.reputation[key] = BorrowerReputation(
                total_reviewed = u256(1),
                approved       = u256(1 if decision == "approve" else 0),
                conditional    = u256(1 if decision == "conditional_approve" else 0),
                rejected       = u256(1 if decision == "reject" else 0),
                average_score  = u256(score),
                last_risk_level = risk,
                last_decision  = decision,
                last_case_id   = case_id,
            )
        else:
            total = int(existing.total_reviewed) + 1
            avg   = (int(existing.average_score) * int(existing.total_reviewed) + score) // total
            self.reputation[key] = BorrowerReputation(
                total_reviewed = u256(total),
                approved       = u256(int(existing.approved)    + (1 if decision == "approve" else 0)),
                conditional    = u256(int(existing.conditional) + (1 if decision == "conditional_approve" else 0)),
                rejected       = u256(int(existing.rejected)    + (1 if decision == "reject" else 0)),
                average_score  = u256(avg),
                last_risk_level = risk,
                last_decision  = decision,
                last_case_id   = case_id,
            )

    def _parse_json_from_llm(self, text: str) -> dict:
        backticks = "``" + "`"
        text = text.replace(backticks + "json", "").replace(backticks, "")
        first = text.find("{")
        last  = text.rfind("}")
        if first == -1 or last == -1:
            raise gl.UserError(f"LLM returned no JSON object. Got: {text[:200]}")
        return json.loads(text[first : last + 1])

    # ─── write: borrower ──────────────────────────────────────────────────────

    @gl.public.write
    def create_case(
        self,
        business_name: str,
        business_type: str,
        loan_amount: int,
        loan_duration_months: int,
        loan_purpose: str,
        business_age_months: int,
    ) -> str:
        self._require_not_paused()
        case_id = self._next_case_id()
        sender  = str(gl.message.sender_address)
        now     = self._now()
        self.cases[case_id] = CreditCase(
            borrower               = sender,
            business_name          = business_name,
            business_type          = business_type,
            loan_amount            = u256(loan_amount),
            loan_duration_months   = u256(loan_duration_months),
            loan_purpose           = loan_purpose,
            business_age_months    = u256(business_age_months),
            evidence_commitment    = "",
            status                 = "CREATED",
            created_at             = now,
            updated_at             = now,
        )
        ids = self._get_borrower_ids(sender)
        ids.append(case_id)
        self._set_borrower_ids(sender, ids)
        return case_id

    @gl.public.write
    def commit_evidence(self, case_id: str, commitment: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if str(gl.message.sender_address).lower() != c.borrower.lower():
            raise gl.UserError("Not case owner")
        if c.status != "CREATED":
            raise gl.UserError(f"Expected CREATED, got {c.status}")
        c.evidence_commitment = commitment
        c.status              = "COMMITTED"
        c.updated_at          = self._now()
        self.cases[case_id]   = c

    @gl.public.write
    def reveal_evidence(self, case_id: str, evidence_json: str, salt: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if str(gl.message.sender_address).lower() != c.borrower.lower():
            raise gl.UserError("Not case owner")
        if c.status != "COMMITTED":
            raise gl.UserError(f"Expected COMMITTED, got {c.status}")
        self._verify_commitment(evidence_json, salt, c.evidence_commitment)
        self.case_evidence[case_id] = evidence_json
        c.status                    = "READY_FOR_REVIEW"
        c.updated_at                = self._now()
        self.cases[case_id]         = c

    @gl.public.write.payable
    def trigger_review(self, case_id: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if c.status != "READY_FOR_REVIEW":
            raise gl.UserError(f"Expected READY_FOR_REVIEW, got {c.status}")
        if int(gl.message.value) < int(self.review_fee):
            raise gl.UserError("Insufficient review fee")

        evidence = self.case_evidence.get(case_id, "{}")

        prompt = f"""You are an AI financial underwriter for Fiducia, a decentralized credit protocol on GenLayer.

Evaluate this small business loan application and produce a structured JSON credit verdict.

BUSINESS PROFILE:
- Name: {c.business_name}
- Type: {c.business_type}
- Age: {int(c.business_age_months)} months old
- Loan requested: ${int(c.loan_amount)} over {int(c.loan_duration_months)} months
- Purpose: {c.loan_purpose}

SANITISED EVIDENCE (borrower-provided; hash-verified on-chain):
{evidence}

ASSESSMENT GUIDELINES:
1. Businesses under 12 months old carry higher risk — require strong cash-flow evidence to approve.
2. Loan-to-revenue ratio above 3× is a risk signal.
3. Existing debt close to loan amount suggests over-leverage.
4. Positive repayment history is a strong signal.
5. Market context and sector cyclicality matter.
6. Loan purpose must align with the business type.

Return ONLY the following JSON — no prose, no code fences, no extra keys:
{{
  "credit_score": <integer 0–100>,
  "risk_level": <"low" | "medium" | "high">,
  "decision": <"approve" | "conditional_approve" | "reject">,
  "confidence": <integer 0–100>,
  "repayment_probability": <integer 0–100>,
  "max_loan_amount": <integer, USD>,
  "interest_rate_bps": <integer, basis points — e.g. 1500 = 15%>,
  "loan_duration_months": <integer>,
  "conditions": [<string, only if conditional_approve — else empty list>],
  "reasoning": [<2–4 concise strings explaining the verdict>],
  "risk_flags": [<0–3 specific risk factors>],
  "positive_signals": [<0–3 specific positive signals>]
}}"""

        def score_nondet() -> str:
            dat = self._parse_json_from_llm(gl.nondet.exec_prompt(prompt))
            return json.dumps({
                "credit_score":         max(0, min(100, int(dat["credit_score"]))),
                "risk_level":           str(dat["risk_level"]).lower(),
                "decision":             str(dat["decision"]).lower(),
                "confidence":           max(0, min(100, int(dat.get("confidence", 70)))),
                "repayment_probability": max(0, min(100, int(dat.get("repayment_probability", 50)))),
                "max_loan_amount":      max(0, int(dat.get("max_loan_amount", 0))),
                "interest_rate_bps":    max(0, int(dat.get("interest_rate_bps", 1500))),
                "loan_duration_months": max(1, int(dat.get("loan_duration_months", int(c.loan_duration_months)))),
                "conditions":           [str(x) for x in dat.get("conditions", [])],
                "reasoning":            [str(x) for x in dat.get("reasoning", [])],
                "risk_flags":           [str(x) for x in dat.get("risk_flags", [])],
                "positive_signals":     [str(x) for x in dat.get("positive_signals", [])],
            }, sort_keys=True)

        # Validators independently run the LLM and the Equivalence Principle
        # checks whether their outputs are semantically equivalent using this principle.
        result_str = gl.eq_principle.prompt_comparative(
            score_nondet,
            principle=(
                "The `decision` field must be identical. "
                "The `risk_level` field must be identical. "
                "The `credit_score` values must be within 20 points of each other. "
                "The `repayment_probability` values must be within 20 points of each other. "
                "Minor differences in reasoning text, recommended terms, or conditions are acceptable."
            ),
        )

        v = json.loads(result_str)
        self.verdicts[case_id] = CaseVerdict(
            credit_score         = u256(v["credit_score"]),
            risk_level           = v["risk_level"],
            decision             = v["decision"],
            confidence           = u256(v["confidence"]),
            repayment_probability= u256(v["repayment_probability"]),
            reasoning            = json.dumps(v["reasoning"]),
            risk_flags           = json.dumps(v["risk_flags"]),
            positive_signals     = json.dumps(v["positive_signals"]),
            max_loan_amount      = u256(v["max_loan_amount"]),
            interest_rate_bps    = u256(v["interest_rate_bps"]),
            loan_duration_months = u256(v["loan_duration_months"]),
            conditions           = json.dumps(v["conditions"]),
        )

        c.status        = "REVIEWED"
        c.updated_at    = self._now()
        self.cases[case_id] = c

        reviewed = json.loads(self.reviewed_case_ids)
        if case_id not in reviewed:
            reviewed.append(case_id)
        self.reviewed_case_ids = json.dumps(reviewed)

        self._update_reputation(
            c.borrower, v["credit_score"], v["risk_level"], v["decision"], case_id
        )

    @gl.public.write
    def commit_appeal(self, case_id: str, appeal_commitment: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if str(gl.message.sender_address).lower() != c.borrower.lower():
            raise gl.UserError("Not case owner")
        if c.status != "REVIEWED":
            raise gl.UserError(f"Expected REVIEWED, got {c.status}")
        self.appeal_evidence[case_id + "_commitment"] = appeal_commitment
        c.status     = "APPEAL_COMMITTED"
        c.updated_at = self._now()
        self.cases[case_id] = c

    @gl.public.write
    def reveal_appeal(self, case_id: str, appeal_evidence_json: str, salt: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if str(gl.message.sender_address).lower() != c.borrower.lower():
            raise gl.UserError("Not case owner")
        if c.status != "APPEAL_COMMITTED":
            raise gl.UserError(f"Expected APPEAL_COMMITTED, got {c.status}")
        commitment = self.appeal_evidence.get(case_id + "_commitment", "")
        if commitment:
            self._verify_commitment(appeal_evidence_json, salt, commitment)
        self.appeal_evidence[case_id] = appeal_evidence_json
        c.status     = "READY_FOR_APPEAL_REVIEW"
        c.updated_at = self._now()
        self.cases[case_id] = c

    @gl.public.write.payable
    def trigger_appeal_review(self, case_id: str) -> None:
        self._require_not_paused()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        if c.status != "READY_FOR_APPEAL_REVIEW":
            raise gl.UserError(f"Expected READY_FOR_APPEAL_REVIEW, got {c.status}")
        if int(gl.message.value) < int(self.review_fee):
            raise gl.UserError("Insufficient review fee")

        ov = self.verdicts.get(case_id, None)
        if ov is None:
            raise gl.UserError("No original verdict found")

        appeal_ev = self.appeal_evidence.get(case_id, "{}")

        prompt = f"""You are a senior financial underwriter reviewing a borrower's appeal for Fiducia, a decentralized credit protocol.

ORIGINAL VERDICT:
- Credit score: {int(ov.credit_score)}/100
- Risk level: {ov.risk_level}
- Decision: {ov.decision}
- Original reasoning: {ov.reasoning}
- Risk flags: {ov.risk_flags}

ADDITIONAL APPEAL EVIDENCE (new information the borrower is presenting):
{appeal_ev}

BUSINESS:
- Name: {self.cases[case_id].business_name}
- Loan: ${int(self.cases[case_id].loan_amount)} over {int(self.cases[case_id].loan_duration_months)} months

Determine if the new evidence materially changes the credit assessment.
- "improve": new evidence substantially reduces risk → raise score, possibly upgrade decision
- "worsen": new evidence reveals more risk → lower score, possibly downgrade decision
- "uphold": evidence does not materially change the assessment
- "insufficient_new_evidence": the borrower has not presented genuinely new information

Return ONLY the following JSON — no prose, no code fences:
{{
  "appeal_outcome": <"improve" | "worsen" | "uphold" | "insufficient_new_evidence">,
  "revised_credit_score": <integer 0–100>,
  "revised_risk_level": <"low" | "medium" | "high">,
  "revised_decision": <"approve" | "conditional_approve" | "reject">,
  "confidence": <integer 0–100>,
  "reasoning": [<2–4 sentences explaining the appeal outcome>],
  "max_loan_amount": <integer, USD>,
  "interest_rate_bps": <integer, basis points>,
  "loan_duration_months": <integer>
}}"""

        def appeal_nondet() -> str:
            dat = self._parse_json_from_llm(gl.nondet.exec_prompt(prompt))
            return json.dumps({
                "appeal_outcome":        str(dat["appeal_outcome"]).lower(),
                "revised_credit_score":  max(0, min(100, int(dat["revised_credit_score"]))),
                "revised_risk_level":    str(dat["revised_risk_level"]).lower(),
                "revised_decision":      str(dat["revised_decision"]).lower(),
                "confidence":            max(0, min(100, int(dat.get("confidence", 70)))),
                "reasoning":             [str(x) for x in dat.get("reasoning", [])],
                "max_loan_amount":       max(0, int(dat.get("max_loan_amount", int(ov.max_loan_amount)))),
                "interest_rate_bps":     max(0, int(dat.get("interest_rate_bps", int(ov.interest_rate_bps)))),
                "loan_duration_months":  max(1, int(dat.get("loan_duration_months", int(ov.loan_duration_months)))),
            }, sort_keys=True)

        result_str = gl.eq_principle.prompt_comparative(
            appeal_nondet,
            principle=(
                "The `appeal_outcome` field must be identical. "
                "The `revised_decision` field must be identical. "
                "The `revised_risk_level` must be identical. "
                "The `revised_credit_score` values must be within 20 points of each other. "
                "Minor differences in reasoning or recommended terms are acceptable."
            ),
        )

        av = json.loads(result_str)
        self.appeal_verdicts[case_id] = AppealVerdict(
            appeal_outcome       = av["appeal_outcome"],
            revised_credit_score = u256(av["revised_credit_score"]),
            revised_risk_level   = av["revised_risk_level"],
            revised_decision     = av["revised_decision"],
            confidence           = u256(av["confidence"]),
            reasoning            = json.dumps(av["reasoning"]),
            max_loan_amount      = u256(av["max_loan_amount"]),
            interest_rate_bps    = u256(av["interest_rate_bps"]),
            loan_duration_months = u256(av["loan_duration_months"]),
        )

        c.status     = "APPEAL_REVIEWED"
        c.updated_at = self._now()
        self.cases[case_id] = c

        # update reputation with revised verdict
        self._update_reputation(
            c.borrower,
            av["revised_credit_score"],
            av["revised_risk_level"],
            av["revised_decision"],
            case_id,
        )

    @gl.public.write
    def cancel_case(self, case_id: str) -> None:
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        sender = str(gl.message.sender_address).lower()
        if sender != c.borrower.lower() and sender != self.admin.lower():
            raise gl.UserError("Not authorised")
        if c.status in ("REVIEWED", "APPEAL_REVIEWED"):
            raise gl.UserError("Cannot cancel a finalised case")
        c.status     = "CANCELLED"
        c.updated_at = self._now()
        self.cases[case_id] = c

    # ─── write: admin ─────────────────────────────────────────────────────────

    @gl.public.write
    def flag_case(self, case_id: str, reason: str) -> None:
        self._require_admin()
        c = self.cases.get(case_id, None)
        if c is None:
            raise gl.UserError("Case not found")
        c.status     = "FLAGGED"
        c.updated_at = self._now()
        self.cases[case_id] = c

    @gl.public.write
    def set_review_fee(self, new_fee: int) -> None:
        self._require_admin()
        self.review_fee = u256(new_fee)

    @gl.public.write
    def pause(self) -> None:
        self._require_admin()
        self.paused = True

    @gl.public.write
    def unpause(self) -> None:
        self._require_admin()
        self.paused = False

    # ─── read views ───────────────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        c = self.cases.get(case_id, None)
        if c is None:
            return "null"
        return json.dumps({
            "case_id":                         case_id,
            "borrower":                        c.borrower,
            "business_name":                   c.business_name,
            "business_type":                   c.business_type,
            "loan_amount_requested":           int(c.loan_amount),
            "loan_duration_months_requested":  int(c.loan_duration_months),
            "loan_purpose":                    c.loan_purpose,
            "business_age_months":             int(c.business_age_months),
            "evidence_commitment":             c.evidence_commitment,
            "evidence_schema_version":         SCHEMA_VERSION,
            "status":                          c.status,
            "created_at":                      int(c.created_at),
            "updated_at":                      int(c.updated_at),
        })

    @gl.public.view
    def get_case_evidence(self, case_id: str) -> str:
        return self.case_evidence.get(case_id, "null")

    @gl.public.view
    def get_case_verdict(self, case_id: str) -> str:
        v = self.verdicts.get(case_id, None)
        if v is None:
            return "null"
        return json.dumps({
            "case_id":               case_id,
            "credit_score":          int(v.credit_score),
            "risk_level":            v.risk_level,
            "decision":              v.decision,
            "confidence":            int(v.confidence),
            "repayment_probability": int(v.repayment_probability),
            "recommended_terms": {
                "max_loan_amount":     int(v.max_loan_amount),
                "interest_rate":       int(v.interest_rate_bps),
                "loan_duration_months": int(v.loan_duration_months),
                "conditions":         json.loads(v.conditions),
            },
            "reasoning":        json.loads(v.reasoning),
            "risk_flags":       json.loads(v.risk_flags),
            "positive_signals": json.loads(v.positive_signals),
            "reviewed_by_trigger": "GenLayer Optimistic Democracy",
        })

    @gl.public.view
    def get_appeal(self, case_id: str) -> str:
        c = self.cases.get(case_id, None)
        if c is None:
            return "null"
        appeal_statuses = {
            "APPEAL_COMMITTED", "READY_FOR_APPEAL_REVIEW",
            "APPEAL_UNDER_REVIEW", "APPEAL_REVIEWED",
        }
        if c.status not in appeal_statuses:
            return "null"
        return json.dumps({
            "case_id":          case_id,
            "borrower":         c.borrower,
            "appeal_commitment": self.appeal_evidence.get(case_id + "_commitment", ""),
            "status":           c.status,
        })

    @gl.public.view
    def get_appeal_verdict(self, case_id: str) -> str:
        av = self.appeal_verdicts.get(case_id, None)
        if av is None:
            return "null"
        return json.dumps({
            "case_id":             case_id,
            "appeal_outcome":      av.appeal_outcome,
            "revised_credit_score": int(av.revised_credit_score),
            "revised_risk_level":  av.revised_risk_level,
            "revised_decision":    av.revised_decision,
            "confidence":          int(av.confidence),
            "reasoning":           json.loads(av.reasoning),
            "changed_terms": {
                "max_loan_amount":      int(av.max_loan_amount),
                "interest_rate":        int(av.interest_rate_bps),
                "loan_duration_months": int(av.loan_duration_months),
                "conditions":           [],
            },
        })

    @gl.public.view
    def get_borrower_cases(self, address: str) -> str:
        ids    = self._get_borrower_ids(address)
        result = []
        for cid in ids:
            raw = self.get_case(cid)
            if raw != "null":
                result.append(json.loads(raw))
        return json.dumps(result)

    @gl.public.view
    def get_borrower_reputation(self, address: str) -> str:
        r = self.reputation.get(address.lower(), None)
        if r is None:
            return "null"
        return json.dumps({
            "borrower":                  address,
            "total_reviewed_cases":      int(r.total_reviewed),
            "approved_count":            int(r.approved),
            "conditional_count":         int(r.conditional),
            "rejected_count":            int(r.rejected),
            "average_credit_score":      int(r.average_score),
            "average_repayment_probability": 0,
            "last_risk_level":           r.last_risk_level,
            "last_decision":             r.last_decision,
            "last_reviewed_case_id":     r.last_case_id,
        })

    @gl.public.view
    def get_reviewed_cases(self) -> str:
        ids    = json.loads(self.reviewed_case_ids)
        result = []
        for cid in ids:
            c_raw = self.get_case(cid)
            v_raw = self.get_case_verdict(cid)
            if c_raw == "null" or v_raw == "null":
                continue
            av_raw = self.get_appeal_verdict(cid)
            result.append({
                "case":          json.loads(c_raw),
                "verdict":       json.loads(v_raw),
                "appeal_verdict": json.loads(av_raw) if av_raw != "null" else None,
            })
        return json.dumps(result)

    @gl.public.view
    def get_protocol_stats(self) -> str:
        ids     = json.loads(self.reviewed_case_ids)
        appeals = sum(
            1 for cid in ids if self.appeal_verdicts.get(cid, None) is not None
        )
        return json.dumps({
            "total_cases":   int(self.case_counter),
            "total_reviews": len(ids),
            "total_appeals": appeals,
            "review_fee":    int(self.review_fee),
            "paused":        self.paused,
            "admin":         self.admin,
        })
