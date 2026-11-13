from __future__ import annotations

from app.evaluation.interfaces import CoachScenario
from app.evaluation.rubric import CRITERIA, RUBRIC_DESCRIPTIONS
from app.schemas.contracts import TurnOut

_SCORE_BANDS = ("0–2", "3–4", "5–6", "7–8", "9–10")


def build_coach_system_prompt() -> str:
    rubric = "\n".join(
        f"- {criterion.value}: "
        + "; ".join(
            f"{band}: {description}"
            for band, description in zip(
                _SCORE_BANDS,
                RUBRIC_DESCRIPTIONS[criterion],
                strict=True,
            )
        )
        for criterion in CRITERIA
    )
    return (
        "You are an independent communication coach. Judge only what is in the "
        "transcript. Ignore likely speech-recognition artefacts such as punctuation "
        "and odd spellings; judge composure from wording only, not voice tone. Score "
        "each criterion below with an integer from 0 to 10 and cite one or more "
        "candidate turn IDs as evidence. Give qualitative feedback and elaborate "
        "most on the scenario evaluation-focus criteria. Output only a JSON object "
        "matching CoachResult: summary, task_outcome, criteria, strengths, "
        "improvements, next_task. Do not compute or output an overall score, weights, "
        "or delivery metrics.\n\n"
        f"Rubric version 1.0:\n{rubric}"
    )


def build_coach_user_prompt(
    scenario: CoachScenario,
    transcript: list[TurnOut],
) -> str:
    turns = "\n".join(
        f"{turn.id} [{turn.speaker}]: {turn.text}" for turn in transcript
    )
    success_criteria = "\n".join(f"- {item}" for item in scenario.success_criteria)
    focus = ", ".join(item.value for item in scenario.evaluation_focus)
    return (
        "Evaluate this completed interview. Use only candidate turn IDs as evidence.\n\n"
        f"Task goal: {scenario.task_goal}\n"
        f"Task success criteria:\n{success_criteria}\n"
        f"Evaluation focus: {focus}\n\n"
        f"Transcript:\n{turns}"
    )
