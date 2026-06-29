$env:GIT_COMMITTER_NAME="soham-0207"
$env:GIT_COMMITTER_EMAIL="silentdevil1801@gmail.com"
git filter-branch --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "am2802004@gmail.com" ]; then
    export GIT_AUTHOR_NAME="soham-0207"
    export GIT_AUTHOR_EMAIL="silentdevil1801@gmail.com"
fi
' -f -- --all
