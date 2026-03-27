import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PublicFeedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Thank you!</h2>
          <p className="text-sm text-muted-foreground">Your feedback has been submitted.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Public Feedback</h1>
          <p className="text-sm text-muted-foreground">Share your experience with PHC services</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <div className="space-y-2">
            <Label>Select PHC</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Choose a PHC" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phc1">PHC 1</SelectItem>
                <SelectItem value="phc2">PHC 2</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name (optional)</Label>
            <Input id="name" placeholder="Enter your name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Feedback</Label>
            <Textarea id="comment" placeholder="Share your experience..." rows={4} />
          </div>

          <Button type="submit" className="w-full">Submit Feedback</Button>
        </form>

        <button
          onClick={() => navigate("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
        >
          ← Back to home
        </button>
      </div>
    </div>
  );
};

export default PublicFeedback;
