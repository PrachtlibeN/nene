import type { components } from "../api/schema";
import sessionCreatedJson from "../../../docs/api-contracts/examples/session-created.json";
import sessionEndedJson from "../../../docs/api-contracts/examples/session-ended.json";
import evaluationCompletedJson from "../../../docs/api-contracts/examples/evaluation-completed.json";

type Schemas = components["schemas"];

export const healthExample: Schemas["HealthOut"] = {
  status: "degraded",
  version: "0.1.0",
  contract_version: "0.3.0",
  components: {
    database: { status: "ok", detail: null },
    llm: {
      status: "loading",
      models: { roleplay: "configured", evaluation: "configured" },
      detail: null,
    },
    stt: { status: "loading", model: "configured", detail: null },
  },
};

export const scenarioExample: Schemas["ScenarioOut"] = {
  id: "scn_a1b2c3",
  slug: "job-interview-behavioral",
  title: "Behavioral Job Interview",
  description: "Answer tough behavioral questions from a skeptical hiring manager.",
  language: "en",
  difficulty: 2,
  max_turns: 8,
  estimated_minutes: 10,
  definition: {
    persona: {
      name: "Dana Whitfield",
      role: "Senior Engineering Manager",
      style: "Direct, time-pressed, probes vague answers",
      pressure_level: 3,
    },
    task: {
      goal: "Convince the interviewer you can lead a project under tight deadlines.",
      success_criteria: [
        "Gives a concrete example using STAR structure",
        "Quantifies the result",
        "Stays composed when challenged",
      ],
    },
    evaluation_focus: ["structure", "relevance", "composure"],
  },
};

export const scenarioListExample: Schemas["ScenarioListOut"] = {
  items: [
    {
      id: scenarioExample.id,
      slug: scenarioExample.slug,
      title: scenarioExample.title,
      description: scenarioExample.description,
      language: scenarioExample.language,
      difficulty: scenarioExample.difficulty,
      max_turns: scenarioExample.max_turns,
      estimated_minutes: scenarioExample.estimated_minutes,
    },
  ],
  total: 1,
};

export const sessionExample: Schemas["SessionOut"] = {
  id: "ses_9c1f40",
  scenario_id: scenarioExample.id,
  status: "active",
  end_reason: null,
  turn_count: 2,
  max_turns: scenarioExample.max_turns,
  roleplay_conversation_id: "cnv_rp_51ab90",
  created_at: "2026-11-13T10:15:00Z",
  started_at: "2026-11-13T10:15:04Z",
  ended_at: null,
};

export const createdSessionExample: Schemas["SessionOut"] =
  { ...sessionCreatedJson, status: "created" } satisfies Schemas["SessionOut"];

export const endedSessionExample: Schemas["SessionOut"] =
  {
    ...sessionEndedJson,
    status: "ended",
    end_reason: "user_ended",
  } satisfies Schemas["SessionOut"];

export const turnExample: Schemas["TurnOut"] = {
  id: "trn_77e0c1",
  session_id: sessionExample.id,
  idx: 0,
  speaker: "interviewer",
  text: "Tell me about a project you led under a tight deadline.",
  source: "generated",
  speech_meta: null,
  created_at: "2026-11-13T10:15:04Z",
};

export const sessionListExample: Schemas["SessionListOut"] = {
  items: [sessionExample],
  total: 1,
  limit: 20,
  offset: 0,
};

export const startSessionExample: Schemas["StartSessionOut"] = {
  session: {
    ...sessionExample,
    status: "active",
    turn_count: 0,
    started_at: "2026-11-13T10:15:04Z",
  },
  interviewer_turn: turnExample,
};

export const turnSubmitExample: Schemas["TurnSubmitOut"] = {
  candidate_turn: {
    ...turnExample,
    id: "trn_77e0c1",
    idx: 1,
    speaker: "candidate",
    source: "typed",
    text: "In my last role I led a migration.",
    created_at: "2026-11-13T10:15:40Z",
  },
  interviewer_turn: {
    ...turnExample,
    id: "trn_8a02d4",
    idx: 2,
    text: "What was the measurable outcome?",
    created_at: "2026-11-13T10:15:44Z",
  },
  session: {
    ...sessionExample,
    status: "active",
    turn_count: 1,
    started_at: "2026-11-13T10:15:04Z",
  },
};

export const turnListExample: Schemas["TurnListOut"] = {
  session_id: sessionExample.id,
  items: [turnExample],
};

export const speechStatusExample: Schemas["SpeechStatusOut"] = {
  stt: {
    status: "loading",
    engine: "faster-whisper",
    model: "configured",
    device: "cpu",
    language: "en",
  },
  tts: { mode: "browser", server_side: false },
  limits: {
    max_audio_seconds: 120,
    max_audio_mb: 10,
    accepted_types: ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg"],
  },
};

export const transcriptionExample: Schemas["TranscriptionOut"] = {
  text: "In my last role I led a migration of our payments service.",
  language: "en",
  duration_ms: 8420,
  avg_confidence: 0.91,
  word_count: 11,
  processing_ms: 2310,
  segments: [
    {
      start_ms: 0,
      end_ms: 4100,
      text: "In my last role I led a migration",
      confidence: 0.93,
    },
  ],
};

export const evaluationExample: Schemas["EvaluationOut"] = {
  id: "evl_c40e19",
  session_id: sessionExample.id,
  attempt: 1,
  status: "pending",
  rubric_version: "1.0",
  coach_conversation_id: null,
  model: null,
  metrics: null,
  result: null,
  error: null,
  created_at: "2026-11-13T10:30:00Z",
  completed_at: null,
};

const completedEvaluationResult: NonNullable<Schemas["EvaluationOut"]["result"]> = {
  overall_score: 66,
  summary: "Solid content, but answers lacked measurable outcomes.",
  task_outcome: {
    achieved: "partially",
    explanation: "You gave one concrete example but never quantified the result.",
  },
  criteria: [
    {
      criterion: "relevance",
      score: 7,
      weight_percent: 25,
      weighted_points: 17.5,
      rationale: "Relevant examples addressed the prompt.",
      evidence_turn_ids: ["trn_77e0c1"],
    },
    {
      criterion: "structure",
      score: 6,
      weight_percent: 20,
      weighted_points: 12,
      rationale: "The answer had a clear action but no result.",
      evidence_turn_ids: ["trn_8a02d4"],
    },
    {
      criterion: "clarity",
      score: 7,
      weight_percent: 20,
      weighted_points: 14,
      rationale: "The main points were easy to follow.",
      evidence_turn_ids: ["trn_77e0c1"],
    },
    {
      criterion: "composure",
      score: 6,
      weight_percent: 15,
      weighted_points: 9,
      rationale: "The candidate answered follow-up questions calmly.",
      evidence_turn_ids: ["trn_8a02d4"],
    },
    {
      criterion: "conciseness",
      score: 5,
      weight_percent: 10,
      weighted_points: 5,
      rationale: "Some details were repeated.",
      evidence_turn_ids: ["trn_77e0c1"],
    },
    {
      criterion: "language_accuracy",
      score: 8,
      weight_percent: 10,
      weighted_points: 8,
      rationale: "Word choice was accurate and professional.",
      evidence_turn_ids: ["trn_77e0c1"],
    },
  ],
  strengths: [
    {
      text: "Opened with a clear, relevant example.",
      evidence_turn_ids: ["trn_77e0c1"],
    },
  ],
  improvements: [
    {
      text: "Quantify outcomes.",
      evidence_turn_ids: ["trn_8a02d4"],
      example_rewrite: "Say how much the result improved.",
    },
  ],
  next_task: {
    title: "Quantify your impact",
    instructions: "Re-answer the question with two measurable outcomes.",
  },
};

export const completedEvaluationExample: Schemas["EvaluationOut"] = {
  ...evaluationCompletedJson,
  status: "completed",
  result: completedEvaluationResult,
};
