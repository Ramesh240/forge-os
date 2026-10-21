# Ralph Wiggum - Autonomous AI agent loop for Windows PowerShell
# Usage: .\scripts\ralph\ralph.ps1 [-Tool claude|amp] [-MaxIterations 10]

param (
    [string]$Tool = "claude",
    [int]$MaxIterations = 10
)

$ErrorActionPreference = "Stop"

if ($Tool -ne "claude" -and $Tool -ne "amp") {
    Write-Error "Invalid tool '$Tool'. Must be 'claude' or 'amp'."
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$PrdFile = Join-Path $ScriptDir "prd.json"
$ProgressFile = Join-Path $ScriptDir "progress.txt"
$ArchiveDir = Join-Path $ScriptDir "archive"
$LastBranchFile = Join-Path $ScriptDir ".last-branch"

# Archive previous run if branch changed
if ((Test-Path $PrdFile) -and (Test-Path $LastBranchFile)) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        $currentBranch = $prdContent.branchName
        $lastBranch = (Get-Content $LastBranchFile -Raw).Trim()

        if ($currentBranch -and $lastBranch -and ($currentBranch -ne $lastBranch)) {
            $date = (Get-Date).ToString("yyyy-MM-dd")
            $folderName = $lastBranch -replace '^ralph/', ''
            $archiveFolder = Join-Path $ArchiveDir "$date-$folderName"

            Write-Host "Archiving previous run: $lastBranch" -ForegroundColor Yellow
            if (!(Test-Path $archiveFolder)) { New-Item -ItemType Directory -Path $archiveFolder -Force | Out-Null }
            Copy-Item $PrdFile (Join-Path $archiveFolder "prd.json") -Force
            if (Test-Path $ProgressFile) { Copy-Item $ProgressFile (Join-Path $archiveFolder "progress.txt") -Force }
            Write-Host "   Archived to: $archiveFolder" -ForegroundColor Gray

            # Reset progress file
            "# Ralph Progress Log`nStarted: $(Get-Date)`n---`n" | Set-Content -Path $ProgressFile -Encoding UTF8
        }
    } catch {
        Write-Warning "Could not parse previous PRD or branch file: $_"
    }
}

# Track current branch
if (Test-Path $PrdFile) {
    try {
        $prdContent = Get-Content $PrdFile -Raw | ConvertFrom-Json
        if ($prdContent.branchName) {
            $prdContent.branchName | Set-Content -Path $LastBranchFile -Encoding UTF8
        }
    } catch {}
}

# Initialize progress file if missing
if (!(Test-Path $ProgressFile)) {
    "# Ralph Progress Log`nStarted: $(Get-Date)`n---`n" | Set-Content -Path $ProgressFile -Encoding UTF8
}

Write-Host "`n🚀 Starting Ralph - Tool: $Tool - Max iterations: $MaxIterations" -ForegroundColor Cyan

for ($i = 1; $i -le $MaxIterations; $i++) {
    Write-Host "`n===============================================================" -ForegroundColor Magenta
    Write-Host "  Ralph Iteration $i of $MaxIterations ($Tool)" -ForegroundColor Magenta
    Write-Host "===============================================================" -ForegroundColor Magenta

    $output = ""
    if ($Tool -eq "amp") {
        $promptPath = Join-Path $ScriptDir "prompt.md"
        $output = Get-Content $promptPath -Raw | amp --dangerously-allow-all 2>&1 | Tee-Object -Variable rawOutput
    } else {
        $claudePromptPath = Join-Path $ScriptDir "CLAUDE.md"
        # Claude Code autonomous execution
        $output = Get-Content $claudePromptPath -Raw | claude --dangerously-skip-permissions --print 2>&1 | Tee-Object -Variable rawOutput
    }

    $combinedOutput = ($output | Out-String)
    if ($combinedOutput -match "<promise>COMPLETE</promise>") {
        Write-Host "`n🎉 Ralph completed all tasks!" -ForegroundColor Green
        Write-Host "Completed at iteration $i of $MaxIterations" -ForegroundColor Green
        exit 0
    }

    Write-Host "Iteration $i complete. Continuing..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

Write-Host "`n⚠️ Ralph reached max iterations ($MaxIterations) without completing all tasks." -ForegroundColor Yellow
Write-Host "Check $ProgressFile for status." -ForegroundColor Yellow
exit 1
