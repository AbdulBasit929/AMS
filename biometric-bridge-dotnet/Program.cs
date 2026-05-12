using System;
using System.Windows.Forms;

namespace FingerprintBridge
{
    internal static class Program
    {
        [STAThread]
        private static void Main()
        {
            try
            {
                BridgeLog.Write("Launching fingerprint bridge application.");
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new BridgeHostForm());
            }
            catch (Exception ex)
            {
                BridgeLog.Write("Application crashed: " + ex);
                throw;
            }
        }
    }
}
