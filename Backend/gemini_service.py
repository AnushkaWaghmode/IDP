import json
import os
import re
from typing import Any

from dotenv import load_dotenv

load_dotenv()


def _extract_json_block(text: str) -> dict[str, Any] | None:
    if not text:
        return None

    cleaned = text.strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", cleaned, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(0))
    except json.JSONDecodeError:
        return None


def _gemini_generate_json(prompt: str) -> dict[str, Any] | None:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        import google.generativeai as genai

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
        response = model.generate_content(prompt)
        return _extract_json_block(getattr(response, "text", ""))
    except Exception:
        return None


def build_assessment_questions(
    role: str,
    target_role: str,
    preferred_language: str,
    technical_skills: list[str],
    skill_focus: str | None = None,
) -> list[dict[str, Any]]:
    prompt = f"""
    Create exactly 12 realistic interview-style multiple-choice assessment questions for a {role} targeting {target_role}.
    Include categories: language, technology, problem_solving, role_specific.
    Preferred programming language: {preferred_language}
    Technical skills: {technical_skills}
    Skill focus (if any): {skill_focus or "overall"}

    Rules:
    - If skill_focus provided, at least 7/12 questions must be specific to that skill and sound like real interview questions (code-level, scenarios, APIs).
    - Each question MUST have distinct wording and options not reused across questions. No templated “I can / I can’t” phrasing.
    - Provide four QUESTION-SPECIFIC options and include correct_option (must exactly match one option) plus a brief explanation.
    - ids should be slugified as "<category>__<short_slug>".

    Return strict JSON:
    {{
      "questions": [
        {{"id":"technology__spring_boot_rest","category":"technology","text":"...","options":["opt1","opt2","opt3","opt4"],"correct_option":"opt3","explanation":"why"}}
      ]
    }}
    """

    data = _gemini_generate_json(prompt)
    if data and isinstance(data.get("questions"), list) and len(data["questions"]) >= 8:
        return data["questions"][:12]

    # Deterministic fallback for production reliability.
    def mcq(question_id: str, category: str, text: str, correct: str, distractors: list[str]) -> dict[str, Any]:
        # Ensure options are unique and question-tailored
        unique_opts = []
        for opt in [correct, *distractors]:
            if opt not in unique_opts:
                unique_opts.append(opt)
        return {
            "id": question_id,
            "category": category,
            "text": text,
            "options": unique_opts,
            "correct_option": correct,
            "explanation": f"{correct} is preferred for: {text}",
        }
    top_skills = technical_skills[:4] if technical_skills else ["git", "apis", "databases", "testing"]
    focus = (skill_focus or "").strip().lower()
    skill_slug = focus.replace(" ", "_") if focus else None

    if focus:
        return [
            mcq(
                f"skill_{skill_slug}__fundamentals",
                "technology",
                f"In {focus}, what is the best way to design and code a full feature end-to-end?",
                "Break into smaller tasks, design contracts, implement, test, and document",
                [
                    "Jump into coding and refactor later",
                    "Rely on framework defaults without design",
                    "Prototype in production and backfill tests",
                ],
            ),
            mcq(
                f"skill_{skill_slug}__collections",
                "problem_solving",
                f"In {focus}, how do you pick the most performant collection for frequent lookups and rare updates?",
                "Use HashMap/ConcurrentHashMap with proper sizing",
                ["Use ArrayList always", "LinkedList for everything", "TreeMap for O(log n) lookups"],
            ),
            mcq(
                f"skill_{skill_slug}__concurrency",
                "technology",
                f"What is the safest way to handle concurrency in {focus} services?",
                "Use thread-safe primitives/executors with clear ownership and avoid shared mutable state",
                ["Synchronize every method", "Spawn raw threads per request", "Ignore race conditions"],
            ),
            mcq(
                f"skill_{skill_slug}__frameworks",
                "technology",
                f"How do you build secure APIs in {focus} frameworks?",
                "Apply authentication/authorization middleware, validate input, log/monitor, and test",
                ["Skip auth in dev and hope for prod parity", "Rely only on client validation", "Expose debug endpoints in prod"],
            ),
            mcq(
                f"skill_{skill_slug}__testing",
                "technology",
                f"Testing {focus} services effectively",
                "Unit test core logic, add integration tests with test containers/mocks, automate in CI",
                ["Rely solely on manual QA", "Test only happy paths", "Skip tests to move fast"],
            ),
            mcq(
                f"skill_{skill_slug}__performance",
                "technology",
                f"Profiling and optimizing {focus} code",
                "Measure with profilers/metrics, find hotspots, optimize, then re-measure",
                ["Guess bottlenecks and rewrite", "Micro-optimize without data", "Disable logging only"],
            ),
            mcq(
                f"skill_{skill_slug}__architecture",
                "role_specific",
                f"Choosing architecture patterns when {focus} is primary stack",
                "Align with domain boundaries, deployment constraints, and team skill; keep it simple first",
                ["Always choose microservices", "Always choose monolith", "Pick whatever is trendy"],
            ),
            mcq(
                f"language__{preferred_language.lower()}_syntax",
                "language",
                f"{preferred_language}: write idiomatic, readable code",
                "Follow language style guides, meaningful names, small functions, consistent formatting",
                ["Compress into one-liners", "Ignore naming conventions", "Mix styles across files"],
            ),
            mcq(
                f"language__{preferred_language.lower()}_debugging",
                "language",
                f"{preferred_language}: debugging complex defects",
                "Use debuggers/trace logs, isolate minimal repro, reason about state, add tests",
                ["Add prints everywhere and hope", "Restart services until it works", "Ignore intermittent issues"],
            ),
            mcq(
                "problem_solving__algorithms",
                "problem_solving",
                "Approach to solve algo/DS problems under time pressure",
                "Clarify constraints, pick right DS, reason about complexity, implement cleanly, test edge cases",
                ["Jump to code immediately", "Brute force first always", "Ignore edge cases to save time"],
            ),
            mcq(
                "problem_solving__debug_strategy",
                "problem_solving",
                "Isolating and fixing production defects quickly",
                "Triage with logs/metrics, reproduce, create hypothesis, patch safely, add regression tests",
                ["Hotfix blindly in prod", "Reboot servers repeatedly", "Disable monitoring"],
            ),
            mcq(
                "technology__version_control",
                "technology",
                "Running Git workflows effectively",
                "Use feature branches, small commits, code reviews, rebasing/merging cleanly",
                ["Force push to main", "Commit to master without review", "One giant commit per release"],
            ),
            mcq(
                "technology__api_design",
                "technology",
                "Designing and documenting REST/JSON APIs end-to-end",
                "Define resources and contracts, versioning, validation, error schemas, docs/tests",
                ["Return 200 for everything", "Skip docs", "Expose DB tables directly"],
            ),
        ]

    # Generic overall assessment (contextual options per topic)
    def ctx(qid: str, category: str, text: str, correct: str, distractors: list[str]) -> dict[str, Any]:
        return mcq(qid, category, text, correct, distractors)

    return [
        ctx(
            f"language__{preferred_language.lower()}_syntax",
            "language",
            f"What is the idiomatic way to manage imports and structure modules in {preferred_language}?",
            "Group related code into modules/packages and avoid wildcard imports",
            ["Place everything in one file", "Use wildcard imports everywhere", "Duplicate code between modules"],
        ),
        ctx(
            f"language__{preferred_language.lower()}_debugging",
            "language",
            f"In {preferred_language}, how do you debug a memory/performance issue?",
            "Profile to find hotspots, use debugger/logging, reproduce and add tests",
            ["Guess and rewrite code", "Ignore and reboot servers", "Add print in random places"],
        ),
        ctx(
            "technology__version_control",
            "technology",
            "Best practice for safe Git-based releases",
            "Feature branches + PR review + CI + tagged releases",
            ["Commit to main with -f", "Zip files to deploy", "One giant unreviewed merge"],
        ),
        ctx(
            "technology__api_design",
            "technology",
            "Designing REST APIs used across teams",
            "Consistent resource naming, versioning, validation, error contracts, docs/tests",
            ["Return 200 for all responses", "Expose DB schema directly", "No versioning or validation"],
        ),
        ctx(
            "problem_solving__algorithms",
            "problem_solving",
            "Choosing a data structure for LRU cache",
            "Use HashMap + doubly linked list/OrderedDict equivalent",
            ["Use array and linear search", "Recompute everything each call", "Store in text file"],
        ),
        ctx(
            "problem_solving__debug_strategy",
            "problem_solving",
            "First steps when a production endpoint spikes in latency",
            "Check metrics/logs, roll back recent changes, create repro, profile the path",
            ["Restart randomly", "Disable monitoring", "Wait and hope"],
        ),
        ctx(
            "role_specific__domain_impact",
            "role_specific",
            f"Delivering impact as a {target_role}",
            "Align work to KPIs, slice deliverables, ship iteratively, measure results",
            ["Pick tasks without context", "Ship once at the end", "Ignore metrics"],
        ),
        ctx(
            "role_specific__execution",
            "role_specific",
            "Ensuring predictable delivery",
            "Break down tasks, estimate, surface risks early, keep comms tight",
            ["Overcommit silently", "Hide blockers", "Work without a plan"],
        ),
        ctx(
            f"technology__{top_skills[0].lower().replace(' ', '_')}",
            "technology",
            f"Applying {top_skills[0]} in production",
            f"Design, implement, test, and deploy {top_skills[0]} features with monitoring",
            [f"Use {top_skills[0]} only in toy scripts", "Skip tests/monitoring", f"Copy-paste {top_skills[0]} snippets without understanding"],
        ),
        ctx(
            f"technology__{top_skills[1].lower().replace(' ', '_')}",
            "technology",
            f"Applying {top_skills[1]} end-to-end",
            f"Model data, handle errors, test, and deploy {top_skills[1]} solutions",
            ["Rely on defaults only", "Ignore edge cases", "No tests"],
        ),
        ctx(
            f"technology__{top_skills[2].lower().replace(' ', '_')}",
            "technology",
            f"Using {top_skills[2]} in production scenarios",
            f"Optimize {top_skills[2]} usage for scalability, reliability, and maintainability",
            ["Use without indexes/limits", "Ignore performance", "Disable security"],
        ),
        ctx(
            f"technology__{top_skills[3].lower().replace(' ', '_')}",
            "technology",
            f"Using {top_skills[3]} for quality and reliability",
            f"Add {top_skills[3]} checks, automate, and gate merges on results",
            ["Run occasionally", "Ignore failures", "Trust manual checks only"],
        ),
    ]


def generate_plan_and_courses(
    role: str,
    target_role: str,
    overall_score: float,
    category_scores: dict[str, float],
    missing_skills: list[str],
    preferred_language: str,
    weekly_hours: int,
    skill_focus: str | None = None,
) -> dict[str, Any]:
    prompt = f"""
    Build a personalized development plan.
    Role: {role}
    Target role: {target_role}
    Overall score: {overall_score}
    Category scores: {category_scores}
    Missing skills: {missing_skills}
    Skill focus: {skill_focus or "overall"}
    Preferred language: {preferred_language}
    Weekly available hours: {weekly_hours}

    Return strict JSON with keys:
    - report_summary: string
    - timeline: list of strings (4-6 milestones)
    - learning_areas: list of strings
    - roadmap: list of objects like {{"area":"Core Java","topics":[{{"name":"Collections","subtopics":["List vs Set","Map performance"]}}],"resources":[{{"title":"...","url":"...","type":"video|course"}}]}}
    - recommended_courses: list of objects with keys title, provider, url, duration, reason
    """

    data = _gemini_generate_json(prompt)
    if data and isinstance(data.get("recommended_courses"), list):
        return data

    return {
        "report_summary": (
            f"You are progressing toward {target_role}. Improve weak categories first and maintain momentum with "
            "consistent weekly execution."
        ),
        "timeline": [
            "Week 1-2: Strengthen missing fundamentals",
            "Week 3-4: Build one role-aligned mini project",
            "Week 5-6: Add testing and deployment",
            "Week 7-8: Publish portfolio and interview prep",
        ],
        "learning_areas": missing_skills[:6] or ["system design", "communication", "testing"],
        "roadmap": [
            {
                "area": "Core Java" if (skill_focus and "java" in skill_focus) else "Core Skills",
                "topics": [
                    {"name": "Collections", "subtopics": ["List vs Set vs Map", "Iteration performance", "Streams"]},
                    {"name": "Concurrency", "subtopics": ["Executors", "CompletableFuture", "Thread safety"]},
                    {"name": "Testing", "subtopics": ["JUnit5", "Mocking", "Integration tests"]},
                ],
                "resources": [
                    {"title": "Java Collections Deep Dive", "url": "https://www.youtube.com/watch?v=wjI1WNcIntg", "type": "video"},
                    {"title": "Effective Java (Bloch)", "url": "https://amzn.to/3LfCw9E", "type": "book"},
                ],
            }
        ],
        "recommended_courses": [
            {
                "title": f"{skill_focus.title() if skill_focus else preferred_language} Specialization",
                "provider": "Coursera",
                "url": f"https://www.coursera.org/search?query={(skill_focus or preferred_language).replace(' ', '%20')}",
                "duration": "Self-paced",
                "reason": "Most relevant Coursera tracks for your chosen skill",
            },
            {
                "title": f"{target_role.title()} projects with {preferred_language}",
                "provider": "Udemy",
                "url": f"https://www.udemy.com/courses/search/?q={(target_role + ' ' + preferred_language).replace(' ', '%20')}",
                "duration": "Project-based",
                "reason": "Hands-on build aligned to your role and language",
            },
            {
                "title": f"{preferred_language} interview prep ({skill_focus or 'core'})",
                "provider": "YouTube",
                "url": f"https://www.youtube.com/results?search_query={(preferred_language + ' ' + (skill_focus or 'interview prep')).replace(' ', '+')}",
                "duration": "Curated playlist",
                "reason": "Free, current videos for quick upskilling",
            },
        ],
    }

 