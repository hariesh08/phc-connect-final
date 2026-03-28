import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, MessageSquare, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const PublicFeedback = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [phcs, setPhcs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedPhc, setSelectedPhc] = useState("");
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    const fetchPhcs = async () => {
      const { data, error } = await supabase
        .from("phcs")
        .select("id, name")
        .order("name");
      if (!error && data) {
        setPhcs(data);
      }
    };
    fetchPhcs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPhc) {
      toast.error("Please select a PHC.");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }
    if (!comment.trim()) {
      toast.error("Please provide some feedback.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        phc_id: selectedPhc,
        rating,
        patient_name: name || "Anonymous",
        comment,
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error("Failed to submit feedback: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <MessageSquare className="h-8 w-8 text-success" />
          </div>
          <h2 className="text-xl font-bold">Thank you!</h2>
          <p className="text-sm text-muted-foreground">Your feedback has been submitted successfully to the administrators.</p>
          <Button variant="outline" onClick={() => navigate("/")}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
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
            <Label>Select PHC <span className="text-destructive">*</span></Label>
            <Select value={selectedPhc} onValueChange={setSelectedPhc}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a PHC" />
              </SelectTrigger>
              <SelectContent>
                {phcs.map(phc => (
                  <SelectItem key={phc.id} value={phc.id}>{phc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating <span className="text-destructive">*</span></Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-colors outline-none focus:ring-2 focus:ring-primary rounded-md"
                >
                  <Star
                    className={`h-7 w-7 ${
                      star <= rating ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Your Name (optional)</Label>
            <Input 
              id="name" 
              placeholder="Enter your name" 
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Your Feedback <span className="text-destructive">*</span></Label>
            <Textarea 
              id="comment" 
              placeholder="Share your experience..." 
              rows={4} 
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit Feedback
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors mx-auto block"
        >
          &larr; Back to home
        </button>
      </div>
    </div>
  );
};

export default PublicFeedback;
