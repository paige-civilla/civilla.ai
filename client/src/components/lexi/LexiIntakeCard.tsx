import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { classifyLexiIntent, buildLexiReply } from "@/lib/lexi/classify";
import { useSpeechToText } from "./useSpeechToText";
import { startIntake } from "@/lib/intakeApi";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mic, MicOff, Plus, Loader2, ArrowRight, AlertCircle } from "lucide-react";

const DISCLAIMER = "Prepared using Civilla for educational and research purposes. Not legal advice.";

interface LexiIntakeCardProps {
  jurisdictionState?: string;
}

export function LexiIntakeCard({ jurisdictionState }: LexiIntakeCardProps) {
  const [, navigate] = useLocation();
  const [input, setInput] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  const stt = useSpeechToText();
  const classification = useMemo(() => classifyLexiIntent(input), [input]);
  const reply = useMemo(() => buildLexiReply(classification.intent), [classification.intent]);

  const mergeTranscript = () => {
    if (!stt.transcript) return;
    setInput((prev) => (prev ? `${prev}\n${stt.transcript}` : stt.transcript));
    stt.reset();
  };

  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setError(null);
    setLoading(true);
    
    try {
      const resp = await startIntake({
        state: jurisdictionState,
        rawIntakeText: input,
      });

      if (!resp.ok) {
        setError(resp.error || resp.note || "Unable to process intake.");
        setLoading(false);
        return;
      }

      if (resp.caseId) {
        setCaseId(resp.caseId);
      }
      setSubmitted(true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Network error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string) => {
    const url = caseId ? `${path}${path.includes('?') ? '&' : '?'}caseId=${caseId}` : path;
    navigate(url);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Tell Lexi what's going on</CardTitle>
        <p className="text-muted-foreground">
          You can type or use speech-to-text. Lexi will help route you to a helpful starting point.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">What's happening?</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Example: I was served divorce papers and there's a court date. Or: I want to modify child support."
            rows={6}
            className="resize-none"
            data-testid="input-intake-text"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            data-testid="button-ask-lexi"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Ask Lexi"
            )}
          </Button>

          {stt.isSupported && (
            <>
              {!stt.isListening ? (
                <Button
                  variant="outline"
                  onClick={stt.start}
                  data-testid="button-start-speech"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  Start speech-to-text
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={stt.stop}
                  data-testid="button-stop-speech"
                >
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}

              <Button
                variant="ghost"
                onClick={mergeTranscript}
                disabled={!stt.transcript}
                data-testid="button-add-transcript"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add transcript
              </Button>
            </>
          )}

          {!stt.isSupported && (
            <span className="text-sm text-muted-foreground">
              Speech-to-text not supported in this browser.
            </span>
          )}
        </div>

        {stt.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Speech error: {stt.error}</AlertDescription>
          </Alert>
        )}

        {stt.transcript && (
          <p className="text-sm text-muted-foreground">
            Transcript preview: <em>{stt.transcript}</em>
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {submitted && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold">{reply.title}</h3>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {reply.message}
              </p>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleNavigate(reply.primaryAction.to)} data-testid="button-primary-action">
                  {reply.primaryAction.label}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                {reply.secondaryAction && (
                  <Button
                    variant="outline"
                    onClick={() => handleNavigate(reply.secondaryAction!.to)}
                    data-testid="button-secondary-action"
                  >
                    {reply.secondaryAction.label}
                  </Button>
                )}

                {reply.tertiaryAction && (
                  <Button
                    variant="ghost"
                    onClick={() => handleNavigate(reply.tertiaryAction!.to)}
                    data-testid="button-tertiary-action"
                  >
                    {reply.tertiaryAction.label}
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground mt-4">{DISCLAIMER}</p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
