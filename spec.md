Product Specification: GitReview AI (MVP Profile Reviewer)

1. System Overview & Core Workflow
   GitReview AI is a lightweight web application that analyzes a user's public GitHub profile using a budget-friendly LLM and generates an immediate, structured performance report on a web dashboard.

Current MVP Scope
No Database: All data is processed in-memory during the request lifecycle.

No Authentication/OAuth: The app uses a standard public GitHub username input field.

No Stripe: All features are free for initial local validation.

Cheap LLM Routing: Uses gpt-4o-mini (or an equivalent cheap/fast model) with strict JSON structured outputs.

2. Backend Architecture (CSR Pattern)
   To ensure the code is production-ready and modular from day one, the backend must strictly follow the Controller-Service-Repository pattern. Even without a database, the repository layer will act as our in-memory data handler.

src/
├── controllers/ # Validates incoming username requests, coordinates the lifecycle, returns JSON responses.
├── services/ # Business logic: githubService (API calls) and aiService (LLM parsing).
├── repositories/ # (Placeholder for MVP) Handles in-memory session caching if needed, directly returning data arrays.
└── routes/ # Maps the POST /api/review endpoint to the controller. 3. Data Ingestion & API Contracts
Phase 1: Public GitHub Data Fetching
Target: GitHub REST API (https://api.github.com/users/{username})

Collected Payload Data:

User Object: Name, bio, location, company, website/blog, Twitter/X handle, hireable flag, avatar (custom vs default identicon), public repository count, public gists, followers, following, account created/last-active dates.

Social Accounts: Linked professional accounts (e.g. LinkedIn, Mastodon) via GET /users/{username}/social_accounts.

Profile README: The special {username}/{username} "About me" README (fetched as base64 JSON and decoded, truncated to ~2000 chars).

Repositories Array: Fetch the 5 most recently pushed public owner repositories for deep critique (sorted by `pushed_at`, descending—not by stars or forks). For each repo, extract: Name, language, description, stars, forks, topics, last-pushed date, and check if a README.md exists.

All Repositories Language Scan: Separately, paginate through up to 100 public owner repos (sorted by most recently pushed) to build a full language inventory used by languageBreakdownAnalysis. If the user has more than 100 public repos, the scan is truncated to the 100 most recently pushed.

Phase 2: Structured AI Analysis Engine
The backend combines the GitHub data into a single string payload and sends it to the LLM. The system prompt forces the model to act as an Elite Technical Recruiter and strictly outputs the following JSON schema:

JSON
{
"overallScore": 84,
"profileSummary": {
"headline": "String summarizing their core profile identity.",
"estimatedExperienceLevel": "Junior / Mid / Senior assessment based on repo scope."
},
"metrics": {
"documentation": {
"score": 70,
"strengths": ["List of markdown documentation strengths"],
"criticalWeaknesses": ["List of documentation missing points"]
},
"codeQuality": {
"score": 80,
"strengths": ["List of language utilization strengths"],
"criticalWeaknesses": ["List of architectural flaws found in descriptions/structures"]
},
"activityAndVelocity": {
"score": 75,
"strengths": ["Commit/update frequency strengths"],
"criticalWeaknesses": ["Gaps in recent work patterns"]
},
"profilePresentation": {
"score": 65,
"strengths": ["Self-branding strengths: bio, profile README, links, avatar"],
"criticalWeaknesses": ["Presentation gaps: empty bio, missing links, no profile README"]
}
},
"languageBreakdownAnalysis": [
{
"language": "e.g., TypeScript",
"repoCount": 8,
"competencyRating": "Beginner | Intermediate | Advanced"
}
],
"mostRecentRepositoriesEvaluated": [
{
"repoName": "Repository Name",
"impactScore": 85,
"visualVibe": "First impression of the repository layout.",
"specificCritique": "Detailed critique of the codebase layout and design pattern choices.",
"priorityFix": "The #1 single thing they should change on this repo right now."
}
],
"personalizedRoadmap": {
"actionItems": [
{
"task": "Concrete, actionable thing the developer should do.",
"priority": "High | Medium | Low",
"category": "e.g., Documentation / Visibility / Code Quality / Activity / Profile"
}
],
"suggestedReadmeKeywords": ["Keyword1", "Keyword2"]
},
"executiveSummary": "A concise, professional 2-4 sentence overview of the developer: who they are, their core strengths, and their overall trajectory (recruiter-facing, not a roast).",
"suggestedProfileBio": "Paste-ready GitHub bio, max 160 characters.",
"profileCompleteness": {
"score": 65,
"checklist": {
"hasAvatar": true,
"hasBio": true,
"hasWebsite": false,
"hasSocialLinks": false,
"hasProfileReadme": false,
"hasCompany": false
},
"missingHighImpactItems": ["Prioritized, friendly suggestions for the missing items above"]
},
"activitySnapshot": {
"reposScanned": 23,
"lastPushAt": "2026-05-28T12:00:00Z",
"lastPushLabel": "3 days ago",
"activeInLast90Days": 7,
"dormantCount": 16,
"activePercent": 30,
"accountCreatedAt": "2019-04-12T00:00:00Z",
"accountAgeLabel": "7 years on GitHub"
},
"pinRecommendations": [
{
"repoName": "my-best-project",
"reason": "12 stars — social proof; has a README; recently updated",
"stars": 12,
"language": "TypeScript"
}
]
},
"contributionCalendar": {
"totalContributions": 842,
"weeks": [
[
{ "date": "2025-05-26", "count": 0, "level": 0 },
{ "date": "2025-05-27", "count": 3, "level": 2 }
]
]
}
}

Note: profileCompleteness, activitySnapshot, pinRecommendations, languageBreakdownAnalysis (repo counts), and contributionCalendar are computed deterministically in code (not by the LLM) so they are always factually accurate; the LLM produces competency ratings for languages and every other narrative field above. contributionCalendar requires GITHUB_TOKEN (GraphQL API).

4. Instructions for Cursor AI Execution
When building from this specification, Cursor must strictly abide by these guardrails:

Do not install or use Mongoose or any database ORM. All data states are short-lived and exist purely in memory during the request.

Strict CSR Enforcement: Keep controllers isolated from business logic. Do not write API calling scripts inside the route handlers or controllers; route them through a dedicated service class.

Defensive API Design: If a GitHub username does not exist or has zero repositories, catch the error elegantly and return a clean HTTP 404/400 response to the frontend rather than crashing the server.

5. Future Scalability Roadmap (To Be Implemented Later)
   These items are currently out of scope for the MVP but must be kept in mind during architectural layout:

Phase 2 - Database Integration: Introduce a native data driver (no heavy abstract ORMs) to store user history, generate permanent shareable URLs for reports, and cache API payloads to protect against GitHub rate limits.

Phase 3 - GitHub OAuth: Move from public inputs to a secure login flow, utilizing the authenticated user's access tokens for higher API rate allowances.

Phase 4 - Monetization & Premium PDF Integration: Implement Stripe Checkout webhooks to gate the deep-dive metrics, the repository-specific code critique, and the downloadable PDF engine behind a premium tier, leaving the base score and the executive summary free.
