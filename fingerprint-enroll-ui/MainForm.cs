using System;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Collections.Generic;
using System.Web.Script.Serialization;
using System.Windows.Forms;

namespace FingerprintEnrollUi
{
    public sealed class MainForm : Form
    {
        private readonly TextBox _employeeIdTextBox;
        private readonly ComboBox _fingerCodeComboBox;
        private readonly Label _statusLabel;
        private readonly Label _resultLabel;
        private readonly ListBox _eventsList;
        private readonly DPFP.Gui.Enrollment.EnrollmentControl _enrollmentControl;
        private readonly HttpClient _httpClient = new HttpClient();
        private readonly JavaScriptSerializer _json = new JavaScriptSerializer();
        private readonly string _backendUrl;

        public MainForm(int initialEmployeeId, string initialFingerCode, string backendUrl)
        {
            _backendUrl = string.IsNullOrWhiteSpace(backendUrl) ? "http://127.0.0.1:4000" : backendUrl.TrimEnd('/');
            Text = "Fingerprint Enrollment";
            StartPosition = FormStartPosition.CenterScreen;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ClientSize = new Size(520, 560);

            var employeeLabel = new Label
            {
                Left = 16,
                Top = 16,
                Width = 90,
                Text = "Employee ID"
            };

            _employeeIdTextBox = new TextBox
            {
                Left = 110,
                Top = 12,
                Width = 90,
                Text = initialEmployeeId.ToString()
            };

            var promptLabel = new Label
            {
                Left = 220,
                Top = 16,
                Width = 280,
                Height = 40,
                Text = "Choose the employee ID and finger slot, then use the HID enrollment UI to enroll the fingerprint in the same format used by verification."
            };

            var fingerLabel = new Label
            {
                Left = 16,
                Top = 44,
                Width = 90,
                Text = "Finger Slot"
            };

            _fingerCodeComboBox = new ComboBox
            {
                Left = 110,
                Top = 40,
                Width = 170,
                DropDownStyle = ComboBoxStyle.DropDownList
            };
            _fingerCodeComboBox.Items.AddRange(new object[]
            {
                "right_thumb",
                "right_index",
                "right_middle",
                "right_ring",
                "right_little",
                "left_thumb",
                "left_index",
                "left_middle",
                "left_ring",
                "left_little"
            });
            _fingerCodeComboBox.SelectedItem = initialFingerCode;
            if (_fingerCodeComboBox.SelectedIndex < 0)
            {
                _fingerCodeComboBox.SelectedItem = "right_index";
            }

            _enrollmentControl = new DPFP.Gui.Enrollment.EnrollmentControl
            {
                Left = 14,
                Top = 72,
                EnrolledFingerMask = 0,
                MaxEnrollFingerCount = 1,
                ReaderSerialNumber = "00000000-0000-0000-0000-000000000000"
            };
            _enrollmentControl.OnEnroll += EnrollmentControl_OnEnroll;
            _enrollmentControl.OnDelete += EnrollmentControl_OnDelete;
            _enrollmentControl.OnStartEnroll += (control, readerSerialNumber, finger) => AddEvent($"OnStartEnroll: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnComplete += (control, readerSerialNumber, finger) => AddEvent($"OnComplete: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnFingerTouch += (control, readerSerialNumber, finger) => AddEvent($"OnFingerTouch: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnFingerRemove += (control, readerSerialNumber, finger) => AddEvent($"OnFingerRemove: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnReaderConnect += (control, readerSerialNumber, finger) => AddEvent($"OnReaderConnect: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnReaderDisconnect += (control, readerSerialNumber, finger) => AddEvent($"OnReaderDisconnect: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnCancelEnroll += (control, readerSerialNumber, finger) => AddEvent($"OnCancelEnroll: {readerSerialNumber}, finger {finger}");
            _enrollmentControl.OnSampleQuality += (control, readerSerialNumber, finger, quality) => AddEvent($"OnSampleQuality: {readerSerialNumber}, finger {finger}, {quality}");

            _statusLabel = new Label
            {
                Left = 16,
                Top = 394,
                Width = 470,
                Height = 24,
                Text = "Ready to enroll."
            };

            _resultLabel = new Label
            {
                Left = 16,
                Top = 422,
                Width = 470,
                Height = 42,
                Text = "Enroll a fingerprint into a named finger slot so one employee can keep multiple enrolled fingers."
            };

            var eventsGroup = new GroupBox
            {
                Left = 16,
                Top = 468,
                Width = 488,
                Height = 90,
                Text = "Events"
            };

            _eventsList = new ListBox
            {
                Left = 12,
                Top = 22,
                Width = 462,
                Height = 54
            };

            eventsGroup.Controls.Add(_eventsList);

            Controls.Add(employeeLabel);
            Controls.Add(_employeeIdTextBox);
            Controls.Add(promptLabel);
            Controls.Add(fingerLabel);
            Controls.Add(_fingerCodeComboBox);
            Controls.Add(_enrollmentControl);
            Controls.Add(_statusLabel);
            Controls.Add(_resultLabel);
            Controls.Add(eventsGroup);

            Shown += (sender, args) =>
            {
                TopMost = true;
                Activate();
                BringToFront();
                TopMost = false;
            };
        }

        private void EnrollmentControl_OnEnroll(object control, int finger, DPFP.Template template, ref DPFP.Gui.EventHandlerStatus status)
        {
            try
            {
                if (!int.TryParse(_employeeIdTextBox.Text, out var employeeId) || employeeId <= 0)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "Invalid employee ID.";
                    _resultLabel.Text = "Enter a valid numeric employee ID before enrolling.";
                    return;
                }

                string templateBase64;
                using (var stream = new MemoryStream())
                {
                    template.Serialize(stream);
                    templateBase64 = Convert.ToBase64String(stream.ToArray());
                }

                var payload = new
                {
                    employeeId = employeeId,
                    fingerCode = _fingerCodeComboBox.SelectedItem?.ToString() ?? "right_index",
                    templateFormat = "DPFP_NET",
                    source = "desktop_enroll_ui",
                    templateBase64 = templateBase64
                };

                var ownershipConflict = RunOwnershipCheck(employeeId, payload.fingerCode);
                if (ownershipConflict != null)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "Enrollment blocked by fingerprint ownership conflict.";
                    _resultLabel.Text = $"This finger already belongs to {ownershipConflict.Name} ({ownershipConflict.Cnic}) in slot '{ownershipConflict.FingerCode}'.";
                    ReportConflict(employeeId, payload.fingerCode, ownershipConflict);
                    AddEvent($"Conflict: employee {ownershipConflict.EmployeeId}, slot {ownershipConflict.FingerCode}");
                    MessageBox.Show(
                        $"This finger already belongs to {ownershipConflict.Name} ({ownershipConflict.Cnic}) in slot '{ownershipConflict.FingerCode}'.\r\nEnrollment has been blocked.",
                        "Fingerprint Ownership Conflict",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Warning);
                    return;
                }

                var response = _httpClient.PostAsync(
                    $"{_backendUrl}/api/biometrics/fingerprint/import-template",
                    new StringContent(_json.Serialize(payload), Encoding.UTF8, "application/json")
                ).GetAwaiter().GetResult();

                var responseText = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                if (!response.IsSuccessStatusCode)
                {
                    status = DPFP.Gui.EventHandlerStatus.Failure;
                    _statusLabel.Text = "Enrollment completed, but backend import failed.";
                    _resultLabel.Text = responseText;
                    AddEvent($"Import failed for employee {employeeId}.");
                    return;
                }

                status = DPFP.Gui.EventHandlerStatus.Success;
                _statusLabel.Text = $"Fingerprint enrolled for employee #{employeeId}.";
                _resultLabel.Text = $"Saved into finger slot '{payload.fingerCode}' using verifier-compatible .NET format.";
                AddEvent($"OnEnroll: finger {finger}, employee {employeeId}, slot {payload.fingerCode}");
                MessageBox.Show(
                    $"Fingerprint enrolled and stored for employee #{employeeId} in slot '{payload.fingerCode}'.",
                    "Fingerprint Enrollment",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                status = DPFP.Gui.EventHandlerStatus.Failure;
                _statusLabel.Text = "Enrollment failed.";
                _resultLabel.Text = ex.GetType().Name + ": " + ex.Message;
                AddEvent("Enrollment error: " + ex.Message);
            }
        }

        private void EnrollmentControl_OnDelete(object control, int finger, ref DPFP.Gui.EventHandlerStatus status)
        {
            status = DPFP.Gui.EventHandlerStatus.Success;
            AddEvent($"OnDelete: finger {finger}");
        }

        private FingerprintCandidate RunOwnershipCheck(int employeeId, string fingerCode)
        {
            var response = _httpClient.GetAsync(
                $"{_backendUrl}/api/biometrics/fingerprint/export-templates?excludeEmployeeId={employeeId}&excludeFingerCode={fingerCode}")
                .GetAwaiter()
                .GetResult();

            var responseText = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException("Could not load existing fingerprint templates for ownership validation.");
            }

            var payload = _json.Deserialize<ExportTemplatesResponse>(responseText);
            var candidates = payload?.Candidates ?? new List<FingerprintCandidate>();
            if (candidates.Count == 0)
            {
                return null;
            }

            using (var dialog = new OwnershipCheckForm(candidates))
            {
                var result = dialog.ShowDialog(this);
                if (result != DialogResult.OK)
                {
                    throw new InvalidOperationException("Ownership check was cancelled before enrollment could be saved.");
                }

                return dialog.MatchedCandidate;
            }
        }

        private void ReportConflict(int employeeId, string fingerCode, FingerprintCandidate matchedCandidate)
        {
            try
            {
                var payload = new
                {
                    employeeId = employeeId,
                    fingerCode = fingerCode,
                    stage = "enrollment",
                    summary = $"Enrollment blocked because the scanned finger already belongs to employee #{matchedCandidate.EmployeeId}.",
                    matchedEmployees = new[]
                    {
                        new
                        {
                            employeeId = matchedCandidate.EmployeeId,
                            name = matchedCandidate.Name,
                            cnic = matchedCandidate.Cnic,
                            fingerCode = matchedCandidate.FingerCode
                        }
                    }
                };

                _httpClient.PostAsync(
                    $"{_backendUrl}/api/biometrics/fingerprint/report-conflict",
                    new StringContent(_json.Serialize(payload), Encoding.UTF8, "application/json")
                ).GetAwaiter().GetResult();
            }
            catch
            {
            }
        }

        private void AddEvent(string message)
        {
            if (InvokeRequired)
            {
                BeginInvoke((Action)(() => AddEvent(message)));
                return;
            }

            _eventsList.Items.Insert(0, message);
        }
    }

    public sealed class FingerprintCandidate
    {
        public int EmployeeId { get; set; }
        public string Name { get; set; }
        public string Cnic { get; set; }
        public string FingerCode { get; set; }
        public bool IsPreferred { get; set; }
        public string TemplateBase64 { get; set; }
        public DPFP.Template Template { get; set; }
    }

    public sealed class ExportTemplatesResponse
    {
        public string Status { get; set; }
        public List<FingerprintCandidate> Candidates { get; set; }
    }

    public sealed class OwnershipCheckForm : Form
    {
        private const int MaxAttempts = 3;
        private readonly DPFP.Gui.Verification.VerificationControl _verificationControl;
        private readonly Label _statusLabel;
        private readonly List<FingerprintCandidate> _candidates = new List<FingerprintCandidate>();
        private readonly Button _cancelButton;
        private int _attempts;

        public FingerprintCandidate MatchedCandidate { get; private set; }

        public OwnershipCheckForm(List<FingerprintCandidate> candidates)
        {
            Text = "Fingerprint Ownership Check";
            StartPosition = FormStartPosition.CenterParent;
            FormBorderStyle = FormBorderStyle.FixedDialog;
            MaximizeBox = false;
            MinimizeBox = false;
            ClientSize = new Size(460, 180);

            var promptLabel = new Label
            {
                Left = 80,
                Top = 18,
                Width = 350,
                Height = 50,
                Text = "Touch the same finger once more. The system will confirm that it does not already belong to another employee."
            };

            _verificationControl = new DPFP.Gui.Verification.VerificationControl
            {
                Left = 20,
                Top = 16,
                Active = true,
                ReaderSerialNumber = "00000000-0000-0000-0000-000000000000"
            };
            _verificationControl.OnComplete += VerificationControl_OnComplete;

            _statusLabel = new Label
            {
                Left = 20,
                Top = 92,
                Width = 410,
                Height = 52,
                Text = $"Waiting for ownership validation scan 1 of {MaxAttempts}..."
            };

            _cancelButton = new Button
            {
                Left = 320,
                Top = 132,
                Width = 100,
                Height = 32,
                Text = "Cancel"
            };
            _cancelButton.Click += (sender, args) =>
            {
                DialogResult = DialogResult.Cancel;
                Close();
            };

            Controls.Add(promptLabel);
            Controls.Add(_verificationControl);
            Controls.Add(_statusLabel);
            Controls.Add(_cancelButton);

            foreach (var candidate in candidates)
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

                _candidates.Add(candidate);
            }

            Shown += (sender, args) =>
            {
                TopMost = true;
                Activate();
                BringToFront();
                TopMost = false;
            };
        }

        private void VerificationControl_OnComplete(object control, DPFP.FeatureSet featureSet, ref DPFP.Gui.EventHandlerStatus status)
        {
            var verifier = new DPFP.Verification.Verification();
            _attempts++;

            foreach (var candidate in _candidates)
            {
                var result = new DPFP.Verification.Verification.Result();
                verifier.Verify(featureSet, candidate.Template, ref result);
                if (result.Verified)
                {
                    MatchedCandidate = candidate;
                    status = DPFP.Gui.EventHandlerStatus.Success;
                    _statusLabel.Text = $"Conflict detected with {candidate.Name} ({candidate.Cnic}) in slot '{candidate.FingerCode}'.";
                    DialogResult = DialogResult.OK;
                    Close();
                    return;
                }
            }

            status = DPFP.Gui.EventHandlerStatus.Success;

            if (_attempts >= MaxAttempts)
            {
                MatchedCandidate = null;
                _statusLabel.Text = "No ownership conflict detected after three confirmation scans.";
                DialogResult = DialogResult.OK;
                Close();
                return;
            }

            _statusLabel.Text = $"No conflict found on scan {_attempts}. Touch the same finger again ({_attempts + 1} of {MaxAttempts}).";
        }
    }
}
