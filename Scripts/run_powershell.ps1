# Define the paths and commands
$commands = @(
    @{ Path = "C:\Users\sghar\Documents\Research-code-repo\Git\meal-prep-nu\Server_node"; Command = "npm run start" },
    @{ Path = "C:\Users\sghar\Documents\Research-code-repo\Git\meal-prep-nu\Webapp\ai-caring-interface"; Command = "npm run start" },
    @{ Path = "C:\Users\sghar\Documents\Research-code-repo\Git\meal-prep-nu\bots"; Command = "python app.py" }
)

# Iterate through the commands and open new shells for each
foreach ($entry in $commands) {
    $path = $entry.Path
    $command = $entry.Command

    Write-Host "Opening new shell for: $command in $path" -ForegroundColor Green

    # Start a new PowerShell process for each command
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command cd `"$path`"; $command" -WorkingDirectory $path
}

Write-Host "All commands have been initiated in separate shells." -ForegroundColor Cyan
