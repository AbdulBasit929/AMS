$ErrorActionPreference = "Stop"

dotnet restore .\FingerprintBridge.csproj
dotnet msbuild .\FingerprintBridge.csproj /t:Build /p:Configuration=Release

