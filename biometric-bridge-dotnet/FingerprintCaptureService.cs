using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace FingerprintBridge
{
    internal sealed class FingerprintCaptureService : DPFP.Capture.EventHandler, IDisposable
    {
        private readonly Control _dispatcher;
        private readonly object _sync = new object();

        private DPFP.Capture.Capture _capturer;
        private DPFP.Processing.Enrollment _enroller;
        private DPFP.Verification.Verification _verificator;
        private TaskCompletionSource<BridgeResponse> _pendingOperation;
        private List<CandidateTemplate> _candidates;
        private OperationMode _mode = OperationMode.None;
        private System.Windows.Forms.Timer _timeoutTimer;
        private int _acceptedSamples;

        public FingerprintCaptureService(Control dispatcher)
        {
            _dispatcher = dispatcher;
        }

        public Task<BridgeResponse> CheckHealthAsync()
        {
            return InvokeAsync(() =>
            {
                return new BridgeResponse
                {
                    StatusCode = 200,
                    Status = "ok",
                    Message = "fingerprint bridge host is running"
                };
            });
        }

        public Task<BridgeResponse> CaptureTemplateAsync()
        {
            var tcs = new TaskCompletionSource<BridgeResponse>();

            InvokeOnUi(() =>
            {
                if (!TryBeginOperation(OperationMode.Enroll, tcs))
                {
                    return;
                }

                try
                {
                    _enroller = new DPFP.Processing.Enrollment();
                    _acceptedSamples = 0;
                    _capturer = new DPFP.Capture.Capture();
                    _capturer.EventHandler = this;
                    _capturer.StartCapture();
                    StartTimeout();
                    Console.WriteLine("Fingerprint enrollment started.");
                }
                catch (Exception ex)
                {
                    Complete(new BridgeResponse
                    {
                        StatusCode = 500,
                        Status = "error",
                        Message = ex.GetType().Name + ": " + ex.Message
                    });
                }
            });

            return tcs.Task;
        }

        public Task<BridgeResponse> IdentifyAsync(IdentifyRequest request)
        {
            var tcs = new TaskCompletionSource<BridgeResponse>();

            InvokeOnUi(() =>
            {
                if (!TryBeginOperation(OperationMode.Identify, tcs))
                {
                    return;
                }

                try
                {
                    _candidates = new List<CandidateTemplate>();
                    if (request?.Candidates != null)
                    {
                        foreach (var candidate in request.Candidates)
                        {
                            if (candidate == null || string.IsNullOrWhiteSpace(candidate.TemplateBase64))
                            {
                                continue;
                            }

                            var bytes = Convert.FromBase64String(candidate.TemplateBase64);
                            using (var ms = new MemoryStream(bytes))
                            {
                                _candidates.Add(new CandidateTemplate
                                {
                                    EmployeeId = candidate.EmployeeId,
                                    Cnic = candidate.Cnic,
                                    Name = candidate.Name,
                                    Template = new DPFP.Template(ms)
                                });
                            }
                        }
                    }

                    if (_candidates.Count == 0)
                    {
                        Complete(new BridgeResponse
                        {
                            StatusCode = 400,
                            Status = "error",
                            Message = "no candidate templates were provided"
                        });
                        return;
                    }

                    _verificator = new DPFP.Verification.Verification();
                    _capturer = new DPFP.Capture.Capture();
                    _capturer.EventHandler = this;
                    _capturer.StartCapture();
                    StartTimeout();
                    Console.WriteLine("Fingerprint identification started.");
                }
                catch (Exception ex)
                {
                    Complete(new BridgeResponse
                    {
                        StatusCode = 500,
                        Status = "error",
                        Message = ex.GetType().Name + ": " + ex.Message
                    });
                }
            });

            return tcs.Task;
        }

        private bool TryBeginOperation(OperationMode mode, TaskCompletionSource<BridgeResponse> tcs)
        {
            lock (_sync)
            {
                if (_pendingOperation != null)
                {
                    tcs.SetResult(new BridgeResponse
                    {
                        StatusCode = 409,
                        Status = "busy",
                        Message = "another fingerprint operation is already running"
                    });
                    return false;
                }

                _pendingOperation = tcs;
                _mode = mode;
                return true;
            }
        }

        private void StartTimeout()
        {
            StopTimeout();
            _timeoutTimer = new System.Windows.Forms.Timer();
            _timeoutTimer.Interval = 60000;
            _timeoutTimer.Tick += (sender, args) =>
            {
                StopTimeout();
                Complete(new BridgeResponse
                {
                    StatusCode = 408,
                    Status = "timeout",
                    Message = "fingerprint operation timed out"
                });
            };
            _timeoutTimer.Start();
        }

        private void StopTimeout()
        {
            if (_timeoutTimer != null)
            {
                _timeoutTimer.Stop();
                _timeoutTimer.Dispose();
                _timeoutTimer = null;
            }
        }

        private void ProcessSample(DPFP.Sample sample)
        {
            if (_mode == OperationMode.Enroll)
            {
                ProcessEnrollmentSample(sample);
                return;
            }

            if (_mode == OperationMode.Identify)
            {
                ProcessIdentificationSample(sample);
            }
        }

        private void ProcessEnrollmentSample(DPFP.Sample sample)
        {
            var features = ExtractFeatures(sample, DPFP.Processing.DataPurpose.Enrollment);
            if (features == null)
            {
                Console.WriteLine("Poor enrollment sample quality, waiting for another scan.");
                return;
            }

            try
            {
                _enroller.AddFeatures(features);
                _acceptedSamples++;
                Console.WriteLine("Accepted enrollment sample " + _acceptedSamples + ".");
            }
            catch (Exception ex)
            {
                Complete(new BridgeResponse
                {
                    StatusCode = 500,
                    Status = "error",
                    Message = ex.GetType().Name + ": " + ex.Message
                });
                return;
            }

            if (_enroller.TemplateStatus == DPFP.Processing.Enrollment.Status.Ready)
            {
                using (var ms = new MemoryStream())
                {
                    _enroller.Template.Serialize(ms);
                    Complete(new BridgeResponse
                    {
                        StatusCode = 200,
                        Status = "captured",
                        Message = "fingerprint template captured successfully",
                        TemplateBase64 = Convert.ToBase64String(ms.ToArray()),
                        SampleCount = _acceptedSamples
                    });
                }
            }
            else if (_enroller.TemplateStatus == DPFP.Processing.Enrollment.Status.Failed)
            {
                Complete(new BridgeResponse
                {
                    StatusCode = 500,
                    Status = "error",
                    Message = "fingerprint enrollment failed"
                });
            }
        }

        private void ProcessIdentificationSample(DPFP.Sample sample)
        {
            var features = ExtractFeatures(sample, DPFP.Processing.DataPurpose.Verification);
            if (features == null)
            {
                Complete(new BridgeResponse
                {
                    StatusCode = 422,
                    Status = "error",
                    Message = "fingerprint sample quality was poor"
                });
                return;
            }

            foreach (var candidate in _candidates)
            {
                var result = new DPFP.Verification.Verification.Result();
                _verificator.Verify(features, candidate.Template, ref result);

                if (result.Verified)
                {
                    Complete(new BridgeResponse
                    {
                        StatusCode = 200,
                        Status = "matched",
                        Message = "fingerprint matched",
                        EmployeeId = candidate.EmployeeId,
                        Cnic = candidate.Cnic,
                        Name = candidate.Name,
                        Score = result.FARAchieved
                    });
                    return;
                }
            }

            Complete(new BridgeResponse
            {
                StatusCode = 404,
                Status = "no_match",
                Message = "no fingerprint matched the provided candidates"
            });
        }

        private static DPFP.FeatureSet ExtractFeatures(DPFP.Sample sample, DPFP.Processing.DataPurpose purpose)
        {
            var extractor = new DPFP.Processing.FeatureExtraction();
            var feedback = DPFP.Capture.CaptureFeedback.None;
            var features = new DPFP.FeatureSet();
            extractor.CreateFeatureSet(sample, purpose, ref feedback, ref features);
            return feedback == DPFP.Capture.CaptureFeedback.Good ? features : null;
        }

        private void Complete(BridgeResponse response)
        {
            StopTimeout();

            TaskCompletionSource<BridgeResponse> pending = null;

            lock (_sync)
            {
                pending = _pendingOperation;
                _pendingOperation = null;
            }

            try
            {
                _capturer?.StopCapture();
            }
            catch
            {
            }

            _capturer = null;
            _enroller = null;
            _verificator = null;
            _candidates = null;
            _acceptedSamples = 0;
            _mode = OperationMode.None;

            pending?.TrySetResult(response);
        }

        private void InvokeOnUi(Action action)
        {
            if (_dispatcher.IsDisposed)
            {
                return;
            }

            if (_dispatcher.InvokeRequired)
            {
                _dispatcher.BeginInvoke(action);
            }
            else
            {
                action();
            }
        }

        private Task<BridgeResponse> InvokeAsync(Func<BridgeResponse> action)
        {
            var tcs = new TaskCompletionSource<BridgeResponse>();
            InvokeOnUi(() =>
            {
                try
                {
                    tcs.SetResult(action());
                }
                catch (Exception ex)
                {
                    tcs.SetResult(new BridgeResponse
                    {
                        StatusCode = 500,
                        Status = "error",
                        Message = ex.GetType().Name + ": " + ex.Message
                    });
                }
            });
            return tcs.Task;
        }

        public void OnComplete(object capture, string readerSerialNumber, DPFP.Sample sample)
        {
            Console.WriteLine("Fingerprint sample captured.");
            InvokeOnUi(() => ProcessSample(sample));
        }

        public void OnFingerGone(object capture, string readerSerialNumber)
        {
            Console.WriteLine("Finger removed from reader.");
        }

        public void OnFingerTouch(object capture, string readerSerialNumber)
        {
            Console.WriteLine("Finger touched reader.");
        }

        public void OnReaderConnect(object capture, string readerSerialNumber)
        {
            Console.WriteLine("Reader connected: " + readerSerialNumber);
        }

        public void OnReaderDisconnect(object capture, string readerSerialNumber)
        {
            Console.WriteLine("Reader disconnected: " + readerSerialNumber);
        }

        public void OnSampleQuality(object capture, string readerSerialNumber, DPFP.Capture.CaptureFeedback captureFeedback)
        {
            Console.WriteLine("Sample quality: " + captureFeedback);
        }

        public void Dispose()
        {
            StopTimeout();
            try
            {
                _capturer?.StopCapture();
            }
            catch
            {
            }
        }
    }

    internal enum OperationMode
    {
        None,
        Enroll,
        Identify
    }
}
