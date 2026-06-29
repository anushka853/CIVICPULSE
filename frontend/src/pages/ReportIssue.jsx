import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalContext } from '../context/GlobalContext';
import Navbar from '../components/Navbar';
import MapComponent from '../components/MapComponent';
import { 
  Camera, 
  MapPin, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Info,
  ShieldCheck,
  Mic,
  MicOff
} from 'lucide-react';

const ReportIssue = () => {
  const { preAnalyzeImage, submitIssue, loading: globalLoading } = useContext(GlobalContext);
  const [step, setStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [fileType, setFileType] = useState('image'); // 'image' or 'video'
  
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Waste Management',
    image: '',
    latitude: 12.9716, // Default Bangalore coords
    longitude: 77.5946,
    severity: 'Medium',
    safetySuggestions: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState('English');
  const navigate = useNavigate();

  const startVoiceSimulation = () => {
    setIsListening(true);
    setTimeout(() => {
      setIsListening(false);
      let text = '';
      if (voiceLang === 'English') {
        text = 'There is a large garbage pile blocking the corner pavement, creating a bad smell and health hazard.';
      } else if (voiceLang === 'Hindi') {
        text = 'यहाँ सड़क के बीचों-बीच बहुत कचरा पड़ा है जिससे रास्ता ब्लॉक हो गया है, कृपया सफाई कराएं।';
      } else if (voiceLang === 'Kannada') {
        text = 'ರಸ್ತೆಯ ಬದಿಯಲ್ಲಿ ಕಸದ ರಾಶಿ ಬಿದ್ದಿದ್ದು ಜನರಿಗೆ ಓಡಾಡಲು ತೊಂದರೆಯಾಗುತ್ತಿದೆ.';
      }
      setFormData(prev => ({
        ...prev,
        description: prev.description ? prev.description + ' ' + text : text
      }));
    }, 3000);
  };

  // Step 1: Handle media selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setFileType(file.type.startsWith('video/') ? 'video' : 'image');
    setSubmitError('');
    setVoiceBlob(null);
    setVoiceUrl('');
  };

  // Voice recording handlers
  const [voiceBlob, setVoiceBlob] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingInterval, setRecordingInterval] = useState(null);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingSeconds(0);

      const interval = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      setSubmitError('');
    } catch (err) {
      console.error('Error starting voice recording:', err);
      setSubmitError('Microphone access denied or unavailable. Please enable microphone permissions in your browser.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
    }
  };

  // Execute multimodal analysis
  const executeAnalysis = async () => {
    if (!imageFile) return setSubmitError('Please select a photo or video first.');

    setAiAnalyzing(true);
    setSubmitError('');

    try {
      const data = new FormData();
      data.append('image', imageFile);
      if (voiceBlob) {
        data.append('voice', voiceBlob, 'voice-recording.webm');
      }

      const result = await preAnalyzeImage(data);

      setFormData(prev => ({
        ...prev,
        title: result.analysis.title || '',
        category: result.analysis.category || 'Waste Management',
        description: result.analysis.description || '',
        severity: result.analysis.severity || 'Medium',
        safetySuggestions: result.analysis.safetySuggestions || '',
        image: result.imageUrl,
      }));

      setStep(2);
    } catch (err) {
      console.error('Multimodal analysis failed:', err);
      setSubmitError('AI analysis timed out or failed. You can still fill the details manually.');
      setStep(2);
    } finally {
      setAiAnalyzing(false);
    }
  };

  // GPS location trigger
  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData(prev => ({
            ...prev,
            latitude: Number(latitude.toFixed(6)),
            longitude: Number(longitude.toFixed(6))
          }));
        },
        (error) => {
          console.error('Error fetching GPS coordinates:', error);
          setSubmitError('Could not retrieve your location. Please check browser permissions.');
        },
        { enableHighAccuracy: true }
      );
    } else {
      setSubmitError('Geolocation is not supported by your browser.');
    }
  };

  // Map coordinate selection callback
  const handleLocationSelect = (lat, lng) => {
    setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
  };

  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!formData.title || !formData.description || !formData.latitude || !formData.longitude || !formData.image) {
      return setSubmitError('Please complete all form fields and pin the location on the map.');
    }

    const res = await submitIssue(formData);
    if (res.success) {
      navigate('/');
    } else {
      setSubmitError(res.error || 'Failed to submit report');
    }
  };

  return (
    <div>
      <Navbar title="Report Community Issue" />

      <div className="fade-in" style={{ marginTop: '1rem', maxWidth: '800px', marginLine: 'auto' }}>
        
        {/* Step indicator bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: step >= 1 ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
              color: step >= 1 ? 'black' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>
            <span style={{ fontSize: '0.9rem', color: step >= 1 ? '#fff' : 'var(--text-muted)' }}>Upload Photo</span>
          </div>

          <div style={{ flexGrow: 1, height: '1px', background: 'var(--border-color)', margin: '0 1rem' }}></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: step >= 2 ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
              color: step >= 2 ? 'black' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700
            }}>
              '2'
            </div>
            <span style={{ fontSize: '0.9rem', color: step >= 2 ? '#fff' : 'var(--text-muted)' }}>Review details & Geotag</span>
          </div>
        </div>

        {submitError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--color-danger)',
            padding: '1rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertTriangle size={16} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Step 1: Upload Area */}
        {step === 1 && (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            {aiAnalyzing ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <Loader2 className="animate-spin" size={48} color="var(--color-primary)" />
                <h4 style={{ color: '#fff', fontSize: '1.2rem' }}>Gemini AI is analyzing the issue...</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '400px' }}>
                  We are automatically identifying the issue type, generating a description, assessing severity, and preparing safety tips.
                </p>
                {imagePreview && (
                  fileType === 'video' ? (
                    <video src={imagePreview} controls style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '12px', marginTop: '1rem', border: '2px solid rgba(255,255,255,0.1)' }} />
                  ) : (
                    <img src={imagePreview} alt="Preview" style={{ width: '180px', height: '180px', objectFit: 'cover', borderRadius: '12px', marginTop: '1rem', border: '2px solid rgba(255,255,255,0.1)' }} />
                  )
                )}
              </div>
            ) : (
              imagePreview ? (
                <div>
                  <div className="grid-2" style={{ gap: '2rem', textAlign: 'left', marginBottom: '2rem' }}>
                    
                    {/* Left Column: Media Preview */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <h4 style={{ fontSize: '1rem', color: '#fff' }}>Selected Media</h4>
                      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', height: '220px', border: '1px solid var(--border-color)' }}>
                        {fileType === 'video' ? (
                          <video src={imagePreview} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </div>
                      <label className="btn btn-secondary" style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={handleImageChange}
                          style={{ display: 'none' }}
                        />
                        <span>Change Photo/Video</span>
                      </label>
                    </div>

                    {/* Right Column: Multimodal Voice Recorder */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Mic color="var(--color-primary)" size={20} />
                        <h4 style={{ fontSize: '1rem', color: '#fff', margin: 0 }}>Native Voice Description</h4>
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        Describe the problem in your local language (e.g. Hindi, Kannada, etc.). Gemini AI will translate and incorporate it into the report!
                      </p>

                      {isRecording ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', flexGrow: 1, padding: '1rem 0' }}>
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', height: '24px' }}>
                            <span style={{ width: '4px', height: '100%', background: 'var(--color-danger)', borderRadius: '2px', animation: 'bounce 0.6s infinite alternate' }}></span>
                            <span style={{ width: '4px', height: '50%', background: 'var(--color-danger)', borderRadius: '2px', animation: 'bounce 0.6s 0.2s infinite alternate' }}></span>
                            <span style={{ width: '4px', height: '80%', background: 'var(--color-danger)', borderRadius: '2px', animation: 'bounce 0.6s 0.1s infinite alternate' }}></span>
                            <span style={{ width: '4px', height: '30%', background: 'var(--color-danger)', borderRadius: '2px', animation: 'bounce 0.6s 0.3s infinite alternate' }}></span>
                            <span style={{ width: '4px', height: '100%', background: 'var(--color-danger)', borderRadius: '2px', animation: 'bounce 0.6s 0.15s infinite alternate' }}></span>
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--color-danger)', fontWeight: 'bold' }}>
                            Recording: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                          </span>
                          <button 
                            type="button" 
                            onClick={stopVoiceRecording} 
                            className="btn btn-primary" 
                            style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)', padding: '0.4rem 1rem', fontSize: '0.8rem', height: 'auto', width: 'auto' }}
                          >
                            Stop Recording
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center', flexGrow: 1 }}>
                          {voiceUrl ? (
                            <>
                              <audio src={voiceUrl} controls style={{ width: '100%', height: '36px' }} />
                              <button 
                                type="button" 
                                onClick={startVoiceRecording} 
                                className="btn btn-secondary" 
                                style={{ fontSize: '0.75rem', height: 'auto', padding: '0.4rem 1rem', width: 'auto', marginInline: 'auto' }}
                              >
                                Record Again
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={startVoiceRecording}
                              className="btn btn-secondary"
                              style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}
                            >
                              <Mic size={16} />
                              <span>Start Local Voice Recording</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Submit Action */}
                  <button
                    type="button"
                    onClick={executeAnalysis}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.85rem', background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)', border: 'none', fontSize: '1rem', fontWeight: 'bold' }}
                  >
                    Scan Issue & AI Analyze with Gemini
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'rgba(14, 165, 233, 0.1)',
                    color: 'var(--color-primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '1.5rem'
                  }}>
                    <Camera size={36} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '0.5rem' }}>Upload Community Problem Media</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '500px', marginInline: 'auto' }}>
                    Upload a clear image or video of a pothole, leaking water pipe, trash heap, or damaged streetlight. 
                    Our multimodal AI will automatically categorize and describe the problem details.
                  </p>

                  <label className="btn btn-primary" style={{ padding: '0.85rem 2rem', cursor: 'pointer' }}>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                    <span>Select Image or Video file</span>
                  </label>
                </div>
              )
            )}
          </div>
        )}

        {/* Step 2: AI Pre-filled Form Details */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck color="var(--color-secondary)" />
                <span>AI Categorized Proposal</span>
              </h3>
              <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-secondary)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                Powered by Gemini 2.5 Flash
              </span>
            </div>

            <div className="grid-2">
              <div>
                <div className="form-group">
                  <label className="form-label">Suggested Report Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="Waste Management">Waste Management</option>
                    <option value="Potholes & Roads">Potholes & Roads</option>
                    <option value="Water Leakage">Water Leakage</option>
                    <option value="Damaged Streetlights">Damaged Streetlights</option>
                    <option value="Public Infrastructure">Public Infrastructure</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Suggested Description</label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <select 
                        value={voiceLang} 
                        onChange={(e) => setVoiceLang(e.target.value)}
                        className="form-control"
                        style={{ width: 'auto', padding: '2px 8px', fontSize: '0.75rem', height: 'auto', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', color: '#fff' }}
                      >
                        <option value="English">English Voice</option>
                        <option value="Hindi">हिन्दी Voice</option>
                        <option value="Kannada">ಕನ್ನಡ Voice</option>
                      </select>
                      
                      <button
                        type="button"
                        onClick={startVoiceSimulation}
                        disabled={isListening}
                        style={{
                          background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(14, 165, 233, 0.1)',
                          border: `1px solid ${isListening ? 'var(--color-danger)' : 'var(--color-primary)'}`,
                          padding: '3px 8px',
                          borderRadius: '6px',
                          color: isListening ? 'var(--color-danger)' : 'var(--color-primary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}
                      >
                        {isListening ? <MicOff size={12} /> : <Mic size={12} />}
                        <span>{isListening ? 'Listening...' : 'Speak'}</span>
                      </button>
                    </div>
                  </div>

                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="form-control"
                    required
                  />

                  {isListening && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                      <div className="waveform" style={{ display: 'flex', gap: '2px', alignItems: 'center', height: '15px' }}>
                        <span style={{ width: '3px', height: '80%', background: 'var(--color-danger)', borderRadius: '1.5px', animation: 'bounce 0.6s infinite alternate' }}></span>
                        <span style={{ width: '3px', height: '40%', background: 'var(--color-danger)', borderRadius: '1.5px', animation: 'bounce 0.6s 0.2s infinite alternate' }}></span>
                        <span style={{ width: '3px', height: '100%', background: 'var(--color-danger)', borderRadius: '1.5px', animation: 'bounce 0.6s 0.4s infinite alternate' }}></span>
                        <span style={{ width: '3px', height: '60%', background: 'var(--color-danger)', borderRadius: '1.5px', animation: 'bounce 0.6s 0.1s infinite alternate' }}></span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Simulating microphone input in {voiceLang}... Speak now.</span>
                    </div>
                  )}

                  <style>{`
                    @keyframes bounce {
                      0% { transform: scaleY(0.3); }
                      100% { transform: scaleY(1.2); }
                    }
                  `}</style>
                </div>

                <div className="form-group">
                  <label className="form-label">Severity Level</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                {/* Image Preview */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Uploaded Media Reference</label>
                  {imagePreview && (
                    fileType === 'video' ? (
                      <video 
                        src={imagePreview} 
                        controls
                        style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-color)' }} 
                      />
                    ) : (
                      <img 
                        src={imagePreview} 
                        alt="Report preview" 
                        style={{ width: '100%', height: '170px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-color)' }} 
                      />
                    )
                  )}
                </div>

                {/* AI Safety Banner */}
                {formData.safetySuggestions && (
                  <div style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.2)',
                    padding: '0.85rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <Info size={18} color="var(--color-info)" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-info)', display: 'block', marginBottom: '2px' }}>
                        AI SAFETY SUGGESTION
                      </span>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formData.safetySuggestions}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Geotag section */}
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ fontSize: '1rem', color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <span>Geotag Report coordinates</span>
                </h4>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
                  onClick={handleUseCurrentLocation}
                >
                  <MapPin size={14} />
                  <span>Use Current Location</span>
                </button>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                Coordinates will pin this issue onto our interactive community dashboard. Click the map to drop the marker.
              </p>

              <MapComponent clickable={true} onLocationSelect={handleLocationSelect} center={[formData.latitude, formData.longitude]} zoom={15} />

              <div className="grid-2" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleInputChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setStep(1)}
                disabled={globalLoading}
              >
                Back
              </button>
              
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={globalLoading}
              >
                {globalLoading ? 'Submitting...' : 'Submit Civic Report (+10 XP)'}
              </button>
            </div>
          </form>
        )}

      </div>
      
      <style>{`
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReportIssue;
