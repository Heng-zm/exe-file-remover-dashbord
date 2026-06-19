import { useState } from "react";
import { toast } from "sonner";
import { MessageSquareText, Send } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api";
import { haptic } from "@/lib/telegram";

export function Feedback() {
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (message.trim().length < 5) {
      toast.error("Please write a little more detail.");
      haptic("warning");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/feedback", { method: "POST", body: { category, message: message.trim() } });
      toast.success("Feedback sent. Thank you!");
      haptic("success");
      setMessage("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send feedback");
      haptic("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary"><MessageSquareText className="h-6 w-6" /></div>
            <div>
              <CardTitle>Feedback</CardTitle>
              <CardDescription>Send bugs, feature requests, UI feedback, or security issues to the developer backend.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bug">Bug report</SelectItem>
                <SelectItem value="feature">Feature request</SelectItem>
                <SelectItem value="ux">UI/UX feedback</SelectItem>
                <SelectItem value="security">Security issue</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Tell us what happened or what you want improved…" />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full sm:w-auto">
            <Send className="mr-2 h-4 w-4" />
            {loading ? "Submitting…" : "Submit feedback"}
          </Button>
        </CardContent>
      </Card>
      <Alert>
        <AlertTitle>Helpful feedback</AlertTitle>
        <AlertDescription>Include group name, Telegram ID, and what action you expected if it is a bug.</AlertDescription>
      </Alert>
    </div>
  );
}
