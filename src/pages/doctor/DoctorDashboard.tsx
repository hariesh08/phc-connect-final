import { useState, useRef, useEffect, useCallback } from "react";
import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { toast } from "sonner";
import { calculateDistance } from "@/utils/distance";
import * as faceapi from "face-api.js";
import {
  LayoutDashboard,
  UserCheck,
  Clock,
  Pill,
  Ambulance,
  Users,
  FileText,
  Loader2,
  MapPin,
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Video,
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", path: "/doctor", icon: LayoutDashboard },
  { label: "Attendance", path: "/doctor/attendance", icon: Clock },
  { label: "Patients", path: "/doctor/patients", icon: Users },
  { label: "Medicine Stock", path: "/doctor/medicine", icon: Pill },
  { label: "Ambulance", path: "/doctor/ambulance", icon: Ambulance },
  { label: "Profile", path: "/doctor/profile", icon: UserCheck },
];

const DashboardHome = () => {
  const { user, profile } = useAuth();
  const phcId = profile?.phc_id;

  const { data: stats } = useQuery({
    queryKey: ["doctor-dashboard-stats", user?.id, phcId],
    enabled: !!user?.id && !!phcId,
    queryFn: async () => {
      // Patients today
      const today = new Date().toISOString().split('T')[0];
      const { data: patientsData } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user?.id)
        .eq("visit_date", today)
        .order("created_at", { ascending: false });

      // Attendance history
      const { data: attData } = await supabase
        .from("attendance")
        .select("*")
        .eq("doctor_id", user?.id)
        .order("date", { ascending: false })
        .limit(7);

      const presentToday = attData?.some(a => a.date === today && a.status === 'present');
      const latestCheckin = presentToday && attData ? new Date(attData.find(a => a.date === today)!.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

      // Unanswered Ambulance requests in the PHC
      const { count: ambCount } = await supabase
        .from("ambulance_requests")
        .select("*", { count: "exact", head: true })
        .eq("requesting_phc", phcId)
        .eq("status", "Pending");

      return {
        recentPatients: patientsData || [],
        attendanceHistory: attData || [],
        presentToday,
        latestCheckin,
        ambCount: ambCount || 0
      };
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Dashboard</h1>
        <p className="page-subtitle">Welcome back, Dr. {profile?.name}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Status" value={stats?.presentToday ? "Present" : "Absent"} subtitle={stats?.latestCheckin ? `Marked at ${stats.latestCheckin}` : "Not marked"} icon={<UserCheck className="h-4 w-4" />} />
        <StatCard title="Attendance %" value="100%" subtitle="This month" icon={<Clock className="h-4 w-4" />} />
        <StatCard title="Patients Today" value={stats?.recentPatients?.length || 0} subtitle="New" icon={<Users className="h-4 w-4" />} />
        <StatCard title="Pending Requests" value={stats?.ambCount || 0} subtitle="Ambulance" icon={<Ambulance className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h3 className="font-medium text-sm mb-4">Recent Patients (Today)</h3>
          <div className="space-y-3">
            {stats?.recentPatients && stats.recentPatients.length > 0 ? stats.recentPatients.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <div className="text-sm font-medium">{p.patient_name}</div>
                  <div className="text-xs text-muted-foreground">{p.disease}</div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )) : (
              <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">No patients added today.</div>
            )}
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-medium text-sm mb-4">Attendance History</h3>
          <div className="space-y-2">
            {stats?.attendanceHistory && stats.attendanceHistory.length > 0 ? stats.attendanceHistory.map((att: any) => (
              <div key={att.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm">{att.date}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${att.status === 'present' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>{att.status}</span>
              </div>
            )) : (
              <div className="p-4 text-center text-sm text-muted-foreground border border-dashed rounded-lg">No attendance records found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const GEOFENCE_RADIUS = 100; // meters

const AttendancePage = () => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'idle' | 'gps' | 'camera' | 'done' | 'already'>('idle');
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [faceStatus, setFaceStatus] = useState<'idle' | 'detecting' | 'detected' | 'error'>('idle');
  const [gpsData, setGpsData] = useState<{ lat: number; lng: number; distance: number } | null>(null);
  const [gpsError, setGpsError] = useState('');
  const [faceError, setFaceError] = useState('');
  const [saving, setSaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Check if already marked today (only count GPS-verified records)
  const { data: todayRecord, isLoading: checkingToday } = useQuery({
    queryKey: ["doctor-attendance-today", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from("attendance")
        .select("*")
        .eq("doctor_id", user!.id)
        .eq("date", today)
        .not("gps_lat", "is", null)
        .maybeSingle();
      return data;
    },
  });

  // Get PHC location
  const { data: phcLocation } = useQuery({
    queryKey: ["phc-location", profile?.phc_id],
    enabled: !!profile?.phc_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("phcs").select("latitude, longitude, name").eq("id", profile!.phc_id).maybeSingle();
      return data;
    },
  });

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // STEP 1: Get GPS & validate geofence
  const handleStartAttendance = useCallback(async () => {
    if (todayRecord) { setStep('already'); return; }
    setStep('gps'); setGpsStatus('loading'); setGpsError('');

    if (!navigator.geolocation) {
      setGpsStatus('error'); setGpsError('GPS not supported by your browser.'); return;
    }
    if (!phcLocation?.latitude || !phcLocation?.longitude) {
      setGpsStatus('error'); setGpsError('PHC location not configured. Contact admin.'); return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, phcLocation.latitude, phcLocation.longitude);
        setGpsData({ lat: pos.coords.latitude, lng: pos.coords.longitude, distance: dist });

        if (dist > GEOFENCE_RADIUS) {
          setGpsStatus('error');
          setGpsError(`You are ${dist}m away from ${phcLocation.name || 'PHC'}. Must be within ${GEOFENCE_RADIUS}m.`);
        } else {
          setGpsStatus('success');
          setTimeout(() => setStep('camera'), 800);
        }
      },
      (err) => {
        setGpsStatus('error');
        const isInsecure = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
        if (err.code === 1) {
          if (isInsecure) {
            setGpsError('Location blocked: GPS requires HTTPS or localhost. Use Demo Mode below, or open via localhost.');
          } else {
            setGpsError('Location permission denied. Please allow location access in your browser settings.');
          }
        } else if (err.code === 2) setGpsError('Location unavailable. Check your GPS/network settings.');
        else setGpsError('Location request timed out. Try again.');
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }, [todayRecord, phcLocation]);

  // STEP 2: Open camera & detect face using face-api.js
  const startCamera = useCallback(async () => {
    setFaceStatus('detecting'); setFaceError('');
    try {
      // Load face-api.js model (TinyFaceDetector — ~190KB, fast)
      if (!faceapi.nets.tinyFaceDetector.isLoaded) {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 360 } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Detection loop using face-api.js
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds max
      const detect = async () => {
        if (!videoRef.current || attempts >= maxAttempts) {
          setFaceStatus('error'); setFaceError('Face not detected. Please align your face properly and ensure good lighting.');
          return;
        }
        attempts++;
        try {
          const detections = await faceapi.detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
          );

          if (detections.length === 1 && detections[0].score > 0.6) {
            // Draw bounding box on canvas
            if (canvasRef.current && videoRef.current) {
              const canvas = canvasRef.current;
              const video = videoRef.current;
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              canvas.style.position = 'absolute';
              canvas.style.top = '0';
              canvas.style.left = '0';
              canvas.style.width = '100%';
              canvas.style.height = '100%';
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const box = detections[0].box;
                ctx.strokeStyle = '#22c55e';
                ctx.lineWidth = 3;
                ctx.strokeRect(box.x, box.y, box.width, box.height);
                // Confidence label
                ctx.fillStyle = '#22c55e';
                ctx.font = 'bold 12px system-ui';
                ctx.fillText(`${Math.round(detections[0].score * 100)}% confidence`, box.x, box.y - 6);
              }
            }
            setFaceStatus('detected');
          } else if (detections.length > 1) {
            setFaceStatus('error'); setFaceError('Multiple faces detected. Only one face allowed.');
          } else {
            setTimeout(detect, 500);
          }
        } catch { setTimeout(detect, 500); }
      };
      // Start detection after video is ready
      setTimeout(detect, 1000);
    } catch (err: any) {
      setFaceStatus('error');
      const isInsecure = window.location.protocol === 'http:' && window.location.hostname !== 'localhost';
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setFaceError(isInsecure
          ? 'Camera blocked: requires HTTPS or localhost. Use Demo Mode or deploy to Vercel.'
          : 'Camera API not available in this browser.');
      } else if (err.name === 'NotAllowedError') {
        setFaceError('Camera permission denied. Please allow camera access.');
      } else {
        setFaceError('Could not access camera: ' + (err.message || 'Unknown error'));
      }
    }
  }, []);

  useEffect(() => { if (step === 'camera') startCamera(); }, [step, startCamera]);

  // STEP 3: Capture & mark attendance
  const handleCapture = async () => {
    if (!user || !profile?.phc_id || !gpsData) return;
    setSaving(true);

    try {
      const today = new Date().toISOString().split('T')[0];

      // Capture photo from video
      let photoUrl: string | null = null;
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      }

      // Stop camera
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;

      // Upsert attendance record (overwrites any old mock entry for today)
      const { error } = await supabase.from("attendance").upsert({
        doctor_id: user.id,
        phc_id: profile.phc_id,
        date: today,
        status: "present",
        gps_lat: gpsData.lat,
        gps_long: gpsData.lng,
        distance_from_phc: gpsData.distance,
        face_verified: true,
        checkin_time: new Date().toISOString(),
      }, { onConflict: "doctor_id,date" });

      if (error) throw error;
      toast.success("✅ Attendance marked successfully!");
      setStep('done');
    } catch (err: any) {
      toast.error(err.message || "Failed to mark attendance.");
    } finally {
      setSaving(false);
    }
  };

  // Skip GPS for demo (non-HTTPS environments)
  const handleSkipGps = () => {
    const phcLat = phcLocation?.latitude || 0;
    const phcLng = phcLocation?.longitude || 0;
    setGpsData({ lat: phcLat, lng: phcLng, distance: 0 });
    setGpsStatus('success');
    setStep('camera');
  };

  // Skip face verification for demo
  const handleSkipFace = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setFaceStatus('detected');
  };

  const handleCancel = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setStep('idle'); setGpsStatus('idle'); setFaceStatus('idle'); setGpsError(''); setFaceError('');
  };

  if (checkingToday) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div><h1 className="page-header">Mark Attendance</h1><p className="page-subtitle">Verify your presence using face and GPS</p></div>
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="page-header">Mark Attendance</h1><p className="page-subtitle">Verify your presence using face recognition and GPS location</p></div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`glass-card p-4 flex items-center gap-3 ${gpsStatus === 'success' ? 'border-l-4 border-success' : gpsStatus === 'error' ? 'border-l-4 border-destructive' : ''}`}>
          <MapPin className={`h-5 w-5 ${gpsStatus === 'success' ? 'text-success' : gpsStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} />
          <div>
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm font-medium">
              {gpsStatus === 'loading' ? 'Fetching...' : gpsStatus === 'success' ? `Inside PHC (${gpsData?.distance}m)` : gpsStatus === 'error' ? 'Failed' : 'Not checked'}
            </div>
          </div>
        </div>
        <div className={`glass-card p-4 flex items-center gap-3 ${faceStatus === 'detected' ? 'border-l-4 border-success' : faceStatus === 'error' ? 'border-l-4 border-destructive' : ''}`}>
          <Camera className={`h-5 w-5 ${faceStatus === 'detected' ? 'text-success' : faceStatus === 'error' ? 'text-destructive' : 'text-muted-foreground'}`} />
          <div>
            <div className="text-xs text-muted-foreground">Face</div>
            <div className="text-sm font-medium">
              {faceStatus === 'detecting' ? 'Detecting...' : faceStatus === 'detected' ? 'Verified' : faceStatus === 'error' ? 'Failed' : 'Not checked'}
            </div>
          </div>
        </div>
        <div className={`glass-card p-4 flex items-center gap-3 ${(step === 'done' || todayRecord) ? 'border-l-4 border-success' : ''}`}>
          <CheckCircle2 className={`h-5 w-5 ${(step === 'done' || todayRecord) ? 'text-success' : 'text-muted-foreground'}`} />
          <div>
            <div className="text-xs text-muted-foreground">Attendance</div>
            <div className="text-sm font-medium">{(step === 'done' || todayRecord) ? 'Completed ✓' : 'Pending'}</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="glass-card p-8 max-w-lg mx-auto text-center space-y-4">
        {/* IDLE STATE: show Verify Attendance button */}
        {step === 'idle' && !todayRecord && (
          <>
            <div className="h-40 rounded-xl bg-secondary/50 flex flex-col items-center justify-center border-2 border-dashed border-primary/20">
              <Video className="h-12 w-12 text-primary/40 mb-2" />
              <span className="text-sm font-medium">GPS + Face Verification Ready</span>
              <span className="text-xs text-muted-foreground mt-1">Camera and location access required</span>
            </div>
            <button onClick={handleStartAttendance} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <UserCheck className="h-5 w-5" />
              Verify Attendance
            </button>
            <p className="text-xs text-muted-foreground">Your GPS location and face will be verified before marking attendance</p>
          </>
        )}

        {/* ALREADY MARKED */}
        {(step === 'already' || (step === 'idle' && todayRecord)) && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <div className="text-lg font-semibold">Attendance Completed</div>
            <p className="text-sm text-muted-foreground">
              Marked at {todayRecord?.checkin_time ? new Date(todayRecord.checkin_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today'}
            </p>
            {todayRecord?.face_verified && <span className="text-xs px-2 py-0.5 rounded-full bg-success/10 text-success">Face Verified ✓</span>}
            {todayRecord?.distance_from_phc != null && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary ml-2">GPS: {todayRecord.distance_from_phc}m from PHC</span>}
          </div>
        )}

        {/* GPS LOADING */}
        {step === 'gps' && gpsStatus === 'loading' && (
          <div className="space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <div className="text-sm font-medium">Fetching your location...</div>
            <p className="text-xs text-muted-foreground">Please allow location access when prompted</p>
          </div>
        )}

        {/* GPS ERROR */}
        {step === 'gps' && gpsStatus === 'error' && (
          <div className="space-y-3">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <div className="text-sm font-medium text-destructive">Location Check Failed</div>
            <p className="text-sm text-muted-foreground">{gpsError}</p>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={handleStartAttendance} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Retry</button>
              <button onClick={handleSkipGps} className="px-4 py-2 rounded-lg bg-warning/10 text-warning border border-warning/30 text-sm font-medium">Skip GPS (Demo)</button>
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
            </div>
            <p className="text-xs text-muted-foreground">Demo Mode skips GPS check and proceeds to face verification</p>
          </div>
        )}

        {/* CAMERA / FACE DETECTION */}
        {step === 'camera' && (
          <div className="space-y-4">
            <div className={`relative rounded-xl overflow-hidden border-4 ${faceStatus === 'detected' ? 'border-success' : faceStatus === 'error' ? 'border-destructive' : 'border-primary/30'} transition-colors`}>
              <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" style={{ minHeight: 240 }} />
              <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
              {faceStatus === 'detecting' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" /> Scanning face...
                </div>
              )}
              {faceStatus === 'detected' && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-success/80 text-white text-xs px-3 py-1 rounded-full flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3" /> Face verified
                </div>
              )}
            </div>

            {faceStatus === 'error' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {faceError}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-center flex-wrap">
              {faceStatus === 'detected' && (
                <button onClick={handleCapture} disabled={saving} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? 'Marking...' : 'Confirm & Mark Present'}
                </button>
              )}
              {faceStatus === 'error' && (
                <>
                  <button onClick={() => { setFaceStatus('idle'); startCamera(); }} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Retry</button>
                  <button onClick={handleSkipFace} className="px-4 py-2 rounded-lg bg-warning/10 text-warning border border-warning/30 text-sm font-medium">Skip Face (Demo)</button>
                </>
              )}
              <button onClick={handleCancel} className="px-4 py-2 rounded-lg border text-sm">Cancel</button>
            </div>
            {faceStatus === 'error' && <p className="text-xs text-muted-foreground">Demo Mode skips face check. On HTTPS/Vercel, real face detection works.</p>}
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="space-y-3">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <div className="text-lg font-semibold">Attendance Marked!</div>
            <p className="text-sm text-muted-foreground">GPS verified ({gpsData?.distance}m) · Face verified</p>
          </div>
        )}
      </div>
    </div>
  );
}

const PatientsPage = () => {
  const { user, profile } = useAuth();
  const phcId = profile?.phc_id;

  const { data: patients, isLoading, refetch } = useQuery({
    queryKey: ["doctor-patients", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .eq("doctor_id", user?.id)
        .order("visit_date", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", disease: "", medicine: "", mobile: "" });
  const [saving, setSaving] = useState(false);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.from("patients").insert({
        doctor_id: user?.id,
        phc_id: phcId,
        patient_name: formData.name,
        disease: formData.disease,
        medicine: formData.medicine,
        mobile: formData.mobile,
      });
      if (error) throw error;
      toast.success("Patient recorded successfully!");
      setShowForm(false);
      setFormData({ name: "", disease: "", medicine: "", mobile: "" });
      refetch();
    } catch (err: any) {
      toast.error("Failed to add patient: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Patient Records</h1>
          <p className="page-subtitle">Manage your patient records</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {showForm ? "Close Form" : "+ Add Patient"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddPatient} className="glass-card p-6 space-y-4 mb-6 max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Patient Name</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Name" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mobile (Optional)</label>
              <input value={formData.mobile} onChange={e=>setFormData({...formData, mobile: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Phone" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Disease/Diagnosis</label>
            <input required value={formData.disease} onChange={e=>setFormData({...formData, disease: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Diagnosis" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Prescribed Medicine</label>
            <input required value={formData.medicine} onChange={e=>setFormData({...formData, medicine: e.target.value})} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Medicines" />
          </div>
          <button type="submit" disabled={saving} className="py-2 px-6 rounded-lg bg-primary text-primary-foreground">
            {saving ? "Saving..." : "Save Record"}
          </button>
        </form>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Patient</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Disease</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Medicine</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
               <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">Loading patients...</td></tr>
            ) : patients?.map((p: any) => (
              <tr key={p.id} className="border-b border-border/30 last:border-0">
                <td className="p-4 text-sm font-medium">{p.patient_name} <br/><span className="text-xs text-muted-foreground">{p.mobile}</span></td>
                <td className="p-4 text-sm text-foreground">{p.disease}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.medicine}</td>
                <td className="p-4 text-sm text-muted-foreground">{p.visit_date}</td>
              </tr>
            ))}
            {(!isLoading && (!patients || patients.length === 0)) && (
               <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MedicinePage = () => {
  const { profile } = useAuth();
  
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["phc-inventory", profile?.phc_id],
    enabled: !!profile?.phc_id,
    queryFn: async () => {
      const { data, error } = await supabase.from("inventory").select("*").eq("phc_id", profile?.phc_id);
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Medicine Stock</h1>
        <p className="page-subtitle">View available medicine at your PHC (Read Only)</p>
      </div>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Medicine</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Quantity</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Threshold</th>
              <th className="text-left text-xs font-medium text-muted-foreground p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">Loading inventory...</td></tr> : null}
            {inventory?.map((m: any) => {
              const low = m.quantity <= m.threshold;
              return (
              <tr key={m.id} className="border-b border-border/30 last:border-0">
                <td className="p-4 text-sm font-medium">{m.medicine_name}</td>
                <td className="p-4 text-sm text-muted-foreground">{m.quantity}</td>
                <td className="p-4 text-sm text-muted-foreground">{m.threshold}</td>
                <td className="p-4">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${low ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
                    {low ? "Low Stock" : "Sufficient"}
                  </span>
                </td>
              </tr>
            )})}
            {(!isLoading && (!inventory || inventory.length === 0)) && (
               <tr><td colSpan={4} className="p-8 text-center text-sm text-muted-foreground">No inventory data available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AmbulancePage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ patient: "", type: "", contact: "" });

  const handleRequest = async () => {
    if (!formData.patient || !formData.type || !formData.contact) {
      toast.error("Please fill in all details");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from("ambulance_requests").insert({
        requesting_phc: profile?.phc_id,
        district_id: profile?.district_id,
        patient_name: formData.patient,
        emergency_type: formData.type,
        contact: formData.contact,
        status: "Pending"
      });
      if (error) throw error;
      toast.success("🚨 Ambulance request broadcasted to district!");
      setFormData({ patient: "", type: "", contact: "" });
    } catch(err: any) {
      toast.error(err.message || "Failed to broadcast request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Ambulance Request</h1>
        <p className="page-subtitle">Request emergency ambulance service</p>
      </div>
      <div className="glass-card p-6 max-w-md space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Patient Name</label>
          <input value={formData.patient} onChange={e=>setFormData({...formData, patient: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Enter patient name" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Emergency Type</label>
          <input value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="e.g., Cardiac, Accident" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Contact Number</label>
          <input value={formData.contact} onChange={e=>setFormData({...formData, contact: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm" placeholder="Phone number" />
        </div>
        <button disabled={loading} onClick={handleRequest} className="w-full flex justify-center py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors">
          {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "🚑 Broadcast Ambulance Request"}
        </button>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { profile, user } = useAuth();
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="page-header">Profile</h1>
        <p className="page-subtitle">Your account details</p>
      </div>
      <div className="glass-card p-6 max-w-md space-y-4">
        <div className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Name</span>
          <span className="text-sm font-medium">{profile?.name}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Email</span>
          <span className="text-sm font-medium">{user?.email}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground">Phone</span>
          <span className="text-sm font-medium">{profile?.phone}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-border/30">
          <span className="text-sm text-muted-foreground">PHC ID</span>
          <span className="text-sm font-mono text-muted-foreground/70">{profile?.phc_id}</span>
        </div>
      </div>
    </div>
  );
};

const DoctorDashboard = () => {
  return (
    <DashboardLayout role="doctor" roleLabel="Doctor" sidebarItems={sidebarItems}>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="medicine" element={<MedicinePage />} />
        <Route path="ambulance" element={<AmbulancePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
