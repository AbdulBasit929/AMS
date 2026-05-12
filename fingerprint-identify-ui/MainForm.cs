using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace FingerprintIdentifyUi
{
    public sealed class MainForm : Form
    {
        private readonly DPFP.Gui.Verification.VerificationControl _verificationControl;
        private readonly Label _statusLabel;
        private readonly Label _resultLabel;
        private readonly Button _reloadButton;
        private readonly Button _closeButton;
        private readonly JavaScriptSerializer _json = new JavaScriptSerializer();
        private readonly HttpClient _httpClient = new HttpClient();
        private List<FingerprintCandidate> _candidates = new List<FingerprintCandidate>();
        private bool _isProcessing;
        private readonly string _backendUrl;
        private readonly int? _employeeId;

        public MainForm(string backendUrl, int? employeeId)
        {
            _backendUrl = string.IsNullOrWhiteSpace(backendUrl) ? "http://127.0.0.1:4000" : backendUrl.TrimEnd('/');
            _employeeId = employeeId;
            Text = "Fingerprint Attendance Verification";
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ClientSize = new Size(470, 220);

            var promptLabel = new Label
            {
                Left = 80,
                Top = 20,
                Width = 360,
                Height = 48,
                Text = "Touch the fingerprint reader with any enrolled finger. This verifier compares the live scan against templates stored in your attendance database."
            };

            _verificationControl = new DPFP.Gui.Verification.VerificationControl
            {
                Left = 20,
                Top = 18,
                Active = true,
                ReaderSerialNumber = "00000000-0000-0000-0000-000000000000"
            };
            _verificationControl.OnComplete += VerificationControl_OnComplete;

            _statusLabel = new Label
            {
                Left = 20,
                Top = 92,
                Width = 420,
                Height = 24,
                Text = "Loading enrolled fingerprints from backend..."
            };

            _resultLabel = new Label
            {
                Left = 20,
                Top = 122,
                Width = 420,
                Height = 44,
                Text = "Waiting for a scan..."
            };

            _reloadButton = new Button
            {
                Left = 20,
                Top = 176,
                Width = 120,
                Text = "Reload Templates"
            };
            _reloadButton.Click += async (sender, args) => await LoadCandidatesAsync();

            _closeButton = new Button
            {
                Left = 350,
                Top = 176,
                Width = 90,
                Text = "Close"
            };
            _closeButton.Click += (sender, args) => Close();

            Controls.Add(promptLabel);
            Controls.Add(_verificationControl);
            Controls.Add(_statusLabel);
            Controls.Add(_resultLabel);
            Controls.Add(_reloadButton);
            Controls.Add(_closeButton);

            Load += async (sender, args) => await LoadCandidatesAsync();
            Shown += (sender, args) =>
            {
                TopMost = true;
                Activate();
                BringToFront();
                TopMost = false;
            };
        }

        private async Task LoadCandidatesAsync()
        {
            try
            {
                _reloadButton.Enabled = false;
                _statusLabel.Text = "Loading enrolled fingerprints from backend...";

                var exportUrl = _employeeId.HasValue
                    ? $"{_backendUrl}/api/biometrics/fingerprint/export-templates?employeeId={_employeeId.Value}"
                    : $"{_backendUrl}/api/biometrics/fingerprint/export-templates";
                var response = await _httpClient.GetAsync(exportUrl);
                var content = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _statusLabel.Text = "Failed to load templates.";
                    _resultLabel.Text = content;
                    return;
                }

                var payload = _json.Deserialize<ExportTemplatesResponse>(content);
                var candidates = new List<FingerprintCandidate>();

                if (payload?.Candidates != null)
                {
                    foreach (var candidate in payload.Candidates)
                    {
                        if (candidate == null || string.IsNullOrWhiteSpace(candidate.TemplateBase64))
                        {
                            continue;
                        }

                        var bytes = Convert.FromBase64String(candidate.TemplateBase64);
                        using (var stream = new MemoryStream(bytes))
                        {
                            candidate.Template = new DPFP.Template(stream);
                        }

                        candidates.Add(candidate);
                    }
                }

                _candidates = candidates;
                _statusLabel.Text = _employeeId.HasValue
                    ? $"Loaded {_candidates.Count} fingerprint template(s) for employee #{_employeeId.Value}."
                    : $"Loaded {_candidates.Count} enrolled fingerprint template(s).";
                _resultLabel.Text = _candidates.Count > 0
                    ? (_employeeId.HasValue
                        ? "Ready. Touch the selected employee's enrolled finger to confirm identity."
                        : "Ready. Touch the reader to verify attendance.")
                    : "No enrolled fingerprint templates are available yet.";
            }
            catch (Exception ex)
            {
                _statusLabel.Text = "Failed to load templates.";
                _resultLabel.Text = ex.GetType().Name + ": " + ex.Message;
            }
            finally
            {
                _reloadButton.Enabled = true;
            }
        }

        private void VerificationControl_OnComplete(object control, DPFP.FeatureSet featureSet, ref DPFP.Gui.EventHandlerStatus status)
        {
            if (_isProcessing)
            {
                status = DPFP.Gui.EventHandlerStatus.Failure;
                return;
            }

            _isProcessing = true;

            try
            {
                if (_candidates.Count == 0)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _resultLabel.Text = "No fingerprint templates are loaded.";
                    return;
                }

                _statusLabel.Text = "Comparing scanned finger against enrolled templates...";

                var verifier = new DPFP.Verification.Verification();
                var matchedCandidates = new List<MatchedFingerprint>();

                foreach (var candidate in _candidates)
                {
                    if (candidate.Template == null)
                    {
                        continue;
                    }

                    var result = new DPFP.Verification.Verification.Result();
                    verifier.Verify(featureSet, candidate.Template, ref result);

                    if (result.Verified)
                    {
                        matchedCandidates.Add(new MatchedFingerprint
                        {
                            Candidate = candidate,
                            Score = result.FARAchieved
                        });
                    }
                }

                if (matchedCandidates.Count == 0)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "No fingerprint match.";
                    _resultLabel.Text = _employeeId.HasValue
                        ? $"This finger does not match employee #{_employeeId.Value}."
                        : "This finger does not match any enrolled employee.";
                    return;
                }

                var distinctEmployeeIds = matchedCandidates
                    .Select((match) => match.Candidate.EmployeeId)
                    .Distinct()
                    .ToList();

                if (!_employeeId.HasValue && distinctEmployeeIds.Count > 1)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "Fingerprint ownership conflict detected.";
                    _resultLabel.Text = "This fingerprint matches multiple employees. Attendance was not marked.";
                    ReportConflict(matchedCandidates);
                    MessageBox.Show(
                        "This fingerprint matches multiple employees. Attendance has been blocked until the conflicting enrollments are resolved.",
                        "Fingerprint Conflict",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);
                    return;
                }

                var matchedCandidate = matchedCandidates
                    .OrderByDescending((match) => match.Candidate.IsPreferred)
                    .ThenBy((match) => match.Score)
                    .First();

                var markPayload = new
                {
                    employeeId = matchedCandidate.Candidate.EmployeeId,
                    score = matchedCandidate.Score
                };

                var body = new StringContent(
                    _json.Serialize(markPayload),
                    Encoding.UTF8,
                    "application/json");

                var response = _httpClient.PostAsync(
                    $"{_backendUrl}/api/biometrics/fingerprint/mark-attendance",
                    body).GetAwaiter().GetResult();

                var responseText = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                if (!response.IsSuccessStatusCode)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "Fingerprint matched, but attendance could not be marked.";
                    _resultLabel.Text = responseText;
                    return;
                }

                var attendanceResponse = _json.Deserialize<MarkAttendanceResponse>(responseText);
                status = DPFP.Gui.EventHandlerStatus.Success;
                _statusLabel.Text = $"Matched: {matchedCandidate.Candidate.Name} ({matchedCandidate.Candidate.Cnic})";
                _resultLabel.Text = BuildAttendanceMessage(matchedCandidate.Candidate, attendanceResponse?.Attendance);
                MessageBox.Show(
                    BuildDialogMessage(matchedCandidate.Candidate, attendanceResponse?.Attendance),
                    "Fingerprint Attendance",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                status = DPFP.Gui.EventHandlerStatus.Failure;
                _statusLabel.Text = "Verification failed.";
                _resultLabel.Text = ex.GetType().Name + ": " + ex.Message;
            }
            finally
            {
                _isProcessing = false;
            }
        }

        private void ReportConflict(List<MatchedFingerprint> matches)
        {
            try
            {
                var payload = new
                {
                    employeeId = _employeeId,
                    fingerCode = _employeeId.HasValue ? "selected_employee_scope" : "global_verify",
                    stage = _employeeId.HasValue ? "scoped_verification" : "global_verification",
                    summary = "Fingerprint matches multiple enrolled employees. Attendance was blocked.",
                    matchedEmployees = matches
                        .Select((match) => new
                        {
                            employeeId = match.Candidate.EmployeeId,
                            name = match.Candidate.Name,
                            cnic = match.Candidate.Cnic,
                            fingerCode = match.Candidate.FingerCode,
                            score = match.Score
                        })
                        .ToList()
                };

                var body = new StringContent(_json.Serialize(payload), Encoding.UTF8, "application/json");
                _httpClient.PostAsync($"{_backendUrl}/api/biometrics/fingerprint/report-conflict", body)
                    .GetAwaiter()
                    .GetResult();
            }
            catch
            {
            }
        }

        private string BuildAttendanceMessage(FingerprintCandidate candidate, AttendanceResult attendance)
        {
            if (attendance == null)
            {
                return $"Attendance updated for employee #{candidate.EmployeeId} using {candidate.FingerCode}.";
            }

            if (attendance.Action == "check_in")
            {
                return $"Check-in recorded for employee #{candidate.EmployeeId} using {candidate.FingerCode}.";
            }

            if (attendance.Action == "check_out")
            {
                return $"Check-out recorded for employee #{candidate.EmployeeId} using {candidate.FingerCode}.";
            }

            if (attendance.Action == "already_closed")
            {
                return $"Attendance already closed today for employee #{candidate.EmployeeId}.";
            }

            return $"Attendance {attendance.Action} for employee #{candidate.EmployeeId} using {candidate.FingerCode}.";
        }

        private string BuildDialogMessage(FingerprintCandidate candidate, AttendanceResult attendance)
        {
            var actionLine = attendance?.Action == "check_in"
                ? "Attendance action: Check-In recorded"
                : attendance?.Action == "check_out"
                    ? "Attendance action: Check-Out recorded"
                    : attendance?.Action == "already_closed"
                        ? "Attendance action: Already checked in and checked out today"
                        : $"Attendance action: {attendance?.Action ?? "updated"}";

            return $"Fingerprint matched for {candidate.Name}.{Environment.NewLine}Finger slot: {candidate.FingerCode}{Environment.NewLine}{actionLine}";
        }
    }

    public sealed class FingerprintCandidate
    {
        public int EmployeeId { get; set; }
        public string Name { get; set; }
        public string Cnic { get; set; }
        public string FingerCode { get; set; }
        public bool IsPreferred { get; set; }
        public string TemplateFormat { get; set; }
        public string TemplateBase64 { get; set; }
        public DPFP.Template Template { get; set; }
    }

    public sealed class MatchedFingerprint
    {
        public FingerprintCandidate Candidate { get; set; }
        public int Score { get; set; }
    }

    public sealed class ExportTemplatesResponse
    {
        public string Status { get; set; }
        public List<FingerprintCandidate> Candidates { get; set; }
    }

    public sealed class MarkAttendanceResponse
    {
        public string Status { get; set; }
        public AttendanceResult Attendance { get; set; }
    }

    public sealed class AttendanceResult
    {
        public string Action { get; set; }
        public int AttendanceId { get; set; }
    }
}
