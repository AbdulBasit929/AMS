using System;
using System.Windows.Forms;

namespace FingerprintIdentifyUi
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            var backendUrl = "http://127.0.0.1:4000";
            int? employeeId = null;

            for (var i = 0; i < args.Length; i++)
            {
                if (args[i] == "--backend-url" && i + 1 < args.Length)
                {
                    backendUrl = args[i + 1];
                    i++;
                }
                else if (args[i] == "--employee-id" && i + 1 < args.Length && int.TryParse(args[i + 1], out var parsedEmployeeId))
                {
                    employeeId = parsedEmployeeId;
                    i++;
                }
            }

            Application.Run(new MainForm(backendUrl, employeeId));
        }
    }
}
