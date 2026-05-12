using System;
using System.IO;

namespace FingerprintBridge
{
    internal static class BridgeLog
    {
        private static readonly string LogPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "bridge.log"
        );

        public static void Write(string message)
        {
            try
            {
                File.AppendAllText(
                    LogPath,
                    $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss}] {message}{Environment.NewLine}"
                );
            }
            catch
            {
            }
        }
    }
}
