# Career Quest ML — Voluntary Activity Engagement

This module estimates:

> **P(employee successfully completes a voluntary development activity)**

It was trained on the official Career Quest dataset v1.0 and is deliberately separate from the career recommendation engine.

## 1. What the model predicts

For an employee, voluntary event, and prediction date, the model returns a completion probability, a coarse risk band, a model version, and carefully scoped signals.

```json
{
  "completion_probability": 0.585228,
  "risk_level": "medium",
  "model_version": "engagement-v1.1-language-free",
  "top_signals": []
}
```

The probability is an engagement signal. It does not mean the activity is career-relevant, eligible, or the best next step.

## 2. Why ML is used

The deterministic Career Gap Engine answers **what the employee needs**. This model answers a narrower behavioral question: **how likely is the employee to complete this already-relevant activity?**

Historical participation patterns, assignment source, delivery format, duration, and employee context can interact in ways that a single skip count cannot represent well. A small tabular model captures those patterns while remaining fast and reproducible.

## 3. Why ML does not choose the recommendation

Career relevance must dominate engagement probability. A highly completable but irrelevant activity must never outrank an activity that closes a critical promotion gap.

The final ranker should:

1. enforce eligibility and prerequisites;
2. compute target-grade relevance, critical-skill importance, gap reduction, and activity impact deterministically;
3. score engagement only for the relevant candidate set; and
4. use `completion_probability` as a bounded secondary signal.

A safe conceptual combination is a multiplicative adjustment such as:

```text
final_score = deterministic_career_score × engagement_multiplier
```

where the multiplier has a narrow range. Exact production weights remain intentionally undefined.

## 4. Official data and training target

Default read-only data location:

```text
data/case_1/career_quest_dataset/
```

Observed source data:

- 200 employees
- 40 activities, including 36 voluntary and 4 mandatory
- 2,743 participation records from 2024-10-01 through 2026-09-30
- dataset snapshot date 2026-10-01

Training target:

| Treatment | Status | Samples |
| --- | --- | ---: |
| Positive | `completed` | 1,044 |
| Negative | `dropped` | 160 |
| Negative | `no_show` | 195 |
| Negative | `declined` | 104 |
| Excluded | `in_progress` | 16 voluntary records |
| Excluded | `overdue` | 90 mandatory records |
| Excluded | all mandatory outcomes | 1,224 records |

The resulting binary dataset contains **1,503 samples: 1,044 positive (69.46%) and 459 negative (30.54%)**.

`overdue` is excluded because the real data confirms it occurs only on mandatory activities. `in_progress` is excluded because its final outcome is unknown. Every mandatory activity is excluded because mandatory completion does not represent voluntary choice.

## 5. Features

All features are available before the current participation outcome.

Employee context:

- role and grade;
- work format;
- tenure derived from `hire_date` at the prediction date, not snapshot `tenure_months`.

Activity context:

- type and format;
- duration;
- number of developed skills and total configured gain;
- prerequisite count and total required levels;
- current role/grade membership in the event targets;
- assignment source (`self`, `manager`, or `hr`).

Strictly historical behavior:

- prior finalized voluntary participation count;
- prior completed, `no_show`, `dropped`, and `declined` counts;
- prior completion rate;
- prior count/rate for the same activity type;
- prior count/rate for the same format;
- activity count/rate in the previous 90 days;
- days since the most recent prior voluntary outcome.

Cold-start rates use a neutral `0.5` value and are accompanied by counts plus `has_prior_history`, so the model can distinguish defaults from observed rates.

### Intentionally omitted

The model does not use current employee skill levels, career-goal gaps, critical target-grade skills, or prerequisite margin. The dataset contains only a current skill snapshot, not historical skill snapshots; using it for old participation rows could leak information acquired after those outcomes. Those features also belong primarily in the deterministic Career Gap Engine.

It also omits event title/ID and employee ID/name to reduce memorization and support unseen profiles.

`preferred_language` was removed in v1.1 by product fairness policy. It is absent from raw features, fitted preprocessing categories, coefficients, and the saved artifact. No language-derived proxy was added.

## 6. Leakage prevention

For a record dated `D`, historical aggregates use only finalized voluntary rows satisfying:

```text
history.date < D
```

Rows on the same date are not treated as prior because their true ordering is unknown. Future validation/test outcomes may become history for a later prediction date, matching an online system where earlier outcomes are known by then.

Forbidden current-record fields never enter the feature matrix:

- `status`
- `completion_pct`
- `score`
- `feedback_rating`
- `due_date`
- `record_id`

Tests assert strict-past behavior and verify these fields are absent.

## 7. Temporal validation

The dataset is divided chronologically without splitting a calendar date:

| Split | Dates | Samples | Positive | Negative |
| --- | --- | ---: | ---: | ---: |
| Train | 2024-10-01 — 2026-03-10 | 1,052 | 728 | 324 |
| Validation | 2026-03-11 — 2026-06-15 | 224 | 166 | 58 |
| Test | 2026-06-16 — 2026-09-30 | 227 | 150 | 77 |

Model selection uses validation Average Precision. The operating threshold is selected on validation by maximizing Youden's J statistic, which balances sensitivity and specificity. Test remains untouched until the final evaluation. After evaluation, the deployable artifact is refit on all 1,503 eligible records.

## 8. Models and metrics

Compared models:

- prior-probability dummy baseline;
- class-unweighted Logistic Regression with one-hot categorical preprocessing;
- HistGradientBoostingClassifier.

Language-free Logistic Regression was selected because its validation PR-AUC was **0.8684**, versus **0.7910** for HistGradientBoosting. With only 1,503 samples, the simpler model generalized better.

The old and new models use identical rows and temporal boundaries. Each operating threshold was selected on validation only.

| Metric | Old: with language | Final: language-free | Dummy baseline |
| --- | ---: | ---: | ---: |
| ROC-AUC | 0.6769 | **0.6637** | 0.5000 |
| PR-AUC / Average Precision | 0.7711 | **0.7546** | 0.6608 |
| F1 | 0.6588 | **0.7148** | 0.7958 |
| Precision | 0.8000 | **0.7376** | 0.6608 |
| Recall | 0.5600 | **0.6933** | 1.0000 |
| Brier score, lower is better | 0.2023 | **0.2051** | 0.2251 |
| Threshold | 0.71598 | **0.62001** | 0.50000 |

Old model confusion matrix:

```text
TN = 56    FP = 21
FN = 66    TP = 84
```

Final language-free confusion matrix:

```text
TN = 40    FP = 37
FN = 46    TP = 104
```

Removing language changed ROC-AUC by `-0.0132`, PR-AUC by `-0.0165`, and Brier by `+0.0027`, all within the predefined `0.03` tolerance. F1 improved by `0.0560` and recall by `0.1333`. The language-free model is selected because performance remains close while the fairness risk is removed.

The dummy baseline's high F1 is misleading: it predicts every sample as completed. ROC-AUC, PR-AUC, Brier score, and the confusion matrix are therefore essential. The model demonstrates useful but moderate discrimination, appropriate only as a secondary ranking signal.

Full machine-readable results are saved in `artifacts/metrics.json`.

## 9. Important signals

Permutation importance was measured on the late test period with Average Precision scoring. The strongest non-negative global signals were:

| Feature | Mean AP decrease when shuffled |
| --- | ---: |
| Assignment source | 0.0535 |
| Previous `no_show` count | 0.0116 |
| Same-format completion rate | 0.0024 |
| Activity duration | 0.0020 |
| Has prior history | 0.0011 |

Only assignment source is clearly stronger than repeated-shuffle uncertainty. Other rankings should be treated as tentative.

CLI `top_signals` are global importance plus current input values. They are explicitly not presented as local causal or directional explanations.

### Logistic Regression coefficient diagnostics

Strongest positive coefficients include `assigned_by=self` (`+0.8020`), Sales Manager (`+0.2701`), certification (`+0.2308`), Product Manager (`+0.2164`), and self-paced format (`+0.1971`). Strongest negative coefficients include `assigned_by=manager` (`-0.4364`), `assigned_by=hr` (`-0.3313`), Backend Engineer (`-0.3115`), meetup (`-0.3091`), and remote work (`-0.1925`).

These are model diagnostics, not causal findings or user-facing explanations. Role/work-format coefficients must not appear in “Why this?” text. User-facing reasoning remains deterministic: skill gap, critical skill, target grade, activity gain, readiness delta, and prerequisites. ML may be described only as a secondary engagement signal.

## 10. Usage

Create the isolated environment from the repository root:

```powershell
python -m venv ml/.venv
.\ml\.venv\Scripts\python -m pip install -r ml\requirements.txt
```

Train and evaluate:

```powershell
.\ml\.venv\Scripts\python -m ml.train
.\ml\.venv\Scripts\python -m ml.evaluate
```

Predict:

```powershell
.\ml\.venv\Scripts\python -m ml.predict --employee E0002 --event EV_006 --date 2026-10-01
```

Python interface:

```python
from ml.predict import predict_engagement

result = predict_engagement("E0002", "EV_006", "2026-10-01")
```

Safe integration wrapper:

```python
from ml.predict import predict_engagement_safe

result = predict_engagement_safe("E0002", "EV_006", "2026-10-01")
```

It catches missing artifacts, feature failures, invalid/NaN probabilities, and other inference exceptions. Failure returns `available=false`, a `null` probability, and `source=deterministic_fallback`; it never invents `0.5`.

Optional flags support a different official-format data directory, artifact path, or assignment source. Mandatory events are rejected because they are outside the model's target population.

## 11. Tests

```powershell
.\ml\.venv\Scripts\python -m pytest ml\tests -q
```

The suite verifies:

- strict-past history with no same-day/future leakage;
- exclusion of mandatory, `overdue`, and `in_progress` records;
- absence of outcome fields from features;
- safe cold-start behavior for unknown employees;
- extra official-format employee profiles;
- official missing-skill rule (`level = 0`); and
- a complete prediction from the saved artifact.
- known employees and new official-format employees with/without history;
- nullable optional profile values and absent skills;
- unseen combinations of valid official categorical values;
- missing-artifact and invalid-probability fallbacks;
- language and identity IDs absent from final features; and
- bounded engagement multiplier values.

## 12. Artifacts

- `artifacts/engagement_model_language_free.joblib` — final fitted language-free Logistic Regression pipeline
- `artifacts/engagement_model.joblib` — backward-compatible alias of the same language-free artifact
- `artifacts/metrics.json` — target counts, exact temporal splits, candidate results, test metrics, and global importances

## 13. Limitations and risks

- The dataset is synthetic and small; real-world calibration and ranking lift are unknown.
- Employee role, grade, work format, and language are current snapshots. Historical changes are unavailable, so early training rows may have snapshot drift.
- Skill snapshots cannot safely reconstruct historical gaps and are intentionally excluded.
- The positive rate shifts from 74.1% in validation to 66.1% in test.
- Probability calibration is only moderately supported by 227 test records.
- Preferred language is removed; future changes must keep the automated no-language test.
- Global permutation importance is not a per-person explanation.
- The model must be retrained and revalidated when additional history changes outcome or population distributions.

## Recommended ranker integration

Use the model only after deterministic eligibility and career relevance filtering. Keep its influence capped and observable. The exact helper is:

```text
engagement_multiplier = 0.9 + 0.2 × clamp(completion_probability, 0, 1)
final_score = deterministic_career_score × engagement_multiplier
```

This maps `p=0` to `0.90`, `p=0.5` to `1.00`, and `p=1` to `1.10`. If ML is unavailable or invalid, the multiplier is neutral `1.00`. Log the deterministic career score, engagement probability, multiplier, final score, and evidence separately so HR can audit why an activity appeared.

Do not duplicate the same behavior penalty in both the deterministic ranker and this probability without testing; otherwise repeated skips/no-shows may be counted twice. Critical-skill relevance and promotion impact must always be able to override engagement convenience.

