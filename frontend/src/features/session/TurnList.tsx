import React, { useEffect, useRef } from "react";
import type { ScenarioOut, TurnOut } from "../../api/client";
import { cleanSpeakerTag } from "../../utils/speech";

interface TurnListProps {
  turns: TurnOut[];
  interviewerName: string;
  personas: ScenarioOut["definition"]["personas"];
  onReplayTurn: (text: string, speakerId?: string) => void;
  isSpeaking: boolean;
}

export const TurnList: React.FC<TurnListProps> = ({
  turns,
  interviewerName,
  personas,
  onReplayTurn,
  isSpeaking,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [turns, turns.length]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[460px] min-h-[220px] bg-washi-100/90 rounded-xl border border-washi-300">
      {turns.map((turn) => {
        const isInterviewer = turn.speaker === "interviewer";
        const panelPersonas = personas ?? [];
        const personaIndex = panelPersonas.findIndex(
          (persona) => persona.id === turn.speaker_id,
        );
        const persona = panelPersonas[personaIndex];
        const speakerName = persona
          ? `${persona.name} - ${persona.role_title}`
          : turn.speaker_name ?? interviewerName;

        return (
          <div
            key={`${turn.id}-${turn.idx}-${turn.speaker}`}
            className={`flex flex-col ${
              isInterviewer ? "items-start" : "items-end"
            }`}
          >
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-xs font-semibold text-sumi-700">
                {isInterviewer ? speakerName : "You"}
              </span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                isInterviewer
                  ? "bg-white text-sumi-900 border border-washi-300 rounded-tl-sm"
                  : "bg-ai-700 text-white rounded-tr-sm shadow-ai-700/20"
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">
                {cleanSpeakerTag(turn.text)}
              </p>

              {/* Replay button for Interviewer */}
              {isInterviewer && (
                <div className="mt-2 pt-2 border-t border-washi-200 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onReplayTurn(
                        cleanSpeakerTag(turn.text),
                        turn.speaker_id ?? undefined,
                      )
                    }
                    aria-label="Replay speech"
                    className="inline-flex items-center gap-1 text-xs text-ai-700 hover:text-ai-800 font-medium focus:outline-none"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                      />
                    </svg>
                    <span>{isSpeaking ? "Speaking..." : "Replay voice"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
};
