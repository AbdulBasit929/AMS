using System;
using System.Windows.Forms;

namespace FingerprintBridge
{
    internal sealed class BridgeHostForm : Form
    {
        private FingerprintCaptureService _captureService;
        private BridgeHttpServer _server;
        private bool _started;

        public BridgeHostForm()
        {
            ShowInTaskbar = false;
            WindowState = FormWindowState.Minimized;
            Opacity = 0;
            FormBorderStyle = FormBorderStyle.FixedToolWindow;
            Text = "Fingerprint Bridge Host";
            Shown += (sender, args) => Hide();
            HandleCreated += (sender, args) => StartBridgeIfNeeded();
        }

        private void StartBridgeIfNeeded()
        {
            if (_started)
            {
                return;
            }

            try
            {
                _started = true;
                BridgeLog.Write("Bridge host handle created. Starting fingerprint bridge.");
                _captureService = new FingerprintCaptureService(this);
                _server = new BridgeHttpServer(_captureService);
                _server.Start();
            }
            catch (Exception ex)
            {
                BridgeLog.Write("Bridge startup failed: " + ex);
                throw;
            }
        }

        protected override void OnFormClosed(FormClosedEventArgs e)
        {
            _server?.Dispose();
            _captureService?.Dispose();
            base.OnFormClosed(e);
        }
    }
}
