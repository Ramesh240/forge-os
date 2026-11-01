$ErrorActionPreference = 'Stop'

$androidRoot = $PSScriptRoot
$workspaceRoot = Split-Path -Parent $androidRoot
$localJdkRoot = Join-Path $workspaceRoot '.toolchains\jdk17'
$localJdk = Get-ChildItem -LiteralPath $localJdkRoot -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
  Select-Object -First 1 -ExpandProperty FullName

if ($localJdk) {
  $env:JAVA_HOME = $localJdk
  $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
} elseif (-not $env:JAVA_HOME -or -not (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
  throw 'Set JAVA_HOME to a supported JDK 17 installation before building the Android release.'
}

$requiredSigningVariables = @(
  'FORGEOS_UPLOAD_STORE_FILE',
  'FORGEOS_UPLOAD_STORE_PASSWORD',
  'FORGEOS_UPLOAD_KEY_ALIAS',
  'FORGEOS_UPLOAD_KEY_PASSWORD'
)
$missingSigningVariables = $requiredSigningVariables | Where-Object { -not [Environment]::GetEnvironmentVariable($_) }
if ($missingSigningVariables) {
  throw "Set the Play upload keystore variables before building: $($missingSigningVariables -join ', ')"
}
if (-not (Test-Path -LiteralPath $env:FORGEOS_UPLOAD_STORE_FILE)) {
  throw 'FORGEOS_UPLOAD_STORE_FILE does not point to an existing keystore.'
}

Push-Location $androidRoot
try {
  & .\gradlew.bat bundleRelease
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}
