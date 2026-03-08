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
) -> list[dict[str, Any]]:
    prompt = f"""
    Create exactly 12 self-assessment questions for a {role} targeting {target_role}.
    Include categories: language, technology, problem_solving, role_specific.
    Preferred programming language: {preferred_language}
    Technical skills: {technical_skills}

    Return strict JSON:
    {{
      "questions": [
        {{"id":"language__python_basics","category":"language","text":"...","options":["none","beginner","intermediate","advanced"]}}
      ]
    }}
    """

    data = _gemini_generate_json(prompt)
    if data and isinstance(data.get("questions"), list) and len(data["questions"]) >= 8:
        return data["questions"][:12]

    # Deterministic fallback for production reliability.
    shared_options = ["none", "beginner", "intermediate", "advanced"]
    top_skills = technical_skills[:4] if technical_skills else ["git", "apis", "databases", "testing"]

    return [
        {"id": f"language__{preferred_language.lower()}_syntax", "category": "language", "text": f"How confident are you with {preferred_language} syntax and code structure?", "options": shared_options},
        {"id": f"language__{preferred_language.lower()}_debugging", "category": "language", "text": f"How confident are you debugging {preferred_language} applications?", "options": shared_options},
        {"id": "technology__version_control", "category": "technology", "text": "How proficient are you with Git branching, pull requests, and code reviews?", "options": shared_options},
        {"id": "technology__api_design", "category": "technology", "text": "How comfortable are you designing and consuming REST APIs?", "options": shared_options},
        {"id": "problem_solving__algorithms", "category": "problem_solving", "text": "How strong are your algorithmic and data structure problem-solving skills?", "options": shared_options},
        {"id": "problem_solving__debug_strategy", "category": "problem_solving", "text": "How effectively do you isolate and fix production defects?", "options": shared_options},
        {"id": "role_specific__domain_impact", "category": "role_specific", "text": f"How prepared are you for the responsibilities of a {target_role}?", "options": shared_options},
        {"id": "role_specific__execution", "category": "role_specific", "text": "How consistently do you plan and deliver scoped outcomes?", "options": shared_options},
        {"id": f"technology__{top_skills[0].lower().replace(' ', '_')}", "category": "technology", "text": f"How confident are you with {top_skills[0]} in real projects?", "options": shared_options},
        {"id": f"technology__{top_skills[1].lower().replace(' ', '_')}", "category": "technology", "text": f"How comfortable are you applying {top_skills[1]} end-to-end?", "options": shared_options},
        {"id": f"technology__{top_skills[2].lower().replace(' ', '_')}", "category": "technology", "text": f"How experienced are you using {top_skills[2]} in production scenarios?", "options": shared_options},
        {"id": f"technology__{top_skills[3].lower().replace(' ', '_')}", "category": "technology", "text": f"How effectively do you use {top_skills[3]} for quality and reliability?", "options": shared_options},
    ]


def generate_plan_and_courses(
    role: str,
    target_role: str,
    overall_score: float,
    category_scores: dict[str, float],
    missing_skills: list[str],
    preferred_language: str,
    weekly_hours: int,
) -> dict[str, Any]:
    prompt = f"""
    Build a personalized development plan.
    Role: {role}
    Target role: {target_role}
    Overall score: {overall_score}
    Category scores: {category_scores}
    Missing skills: {missing_skills}
    Preferred language: {preferred_language}
    Weekly available hours: {weekly_hours}

    Return strict JSON with keys:
    - report_summary: string
    - timeline: list of strings (4-6 milestones)
    - learning_areas: list of strings
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
        "recommended_courses": [
            {
                "title": f"{preferred_language} for Professional Development",
                "provider": "Coursera",
                "url": "https://www.coursera.org",
                "duration": "4-6 weeks",
                "reason": "Aligns with your preferred language and role path",
            },
            {
                "title": "Modern API Design and Backend Engineering",
                "provider": "Udemy",
                "url": "https://www.udemy.com",
                "duration": "6 weeks",
                "reason": "Improves architecture and delivery skills",
            },
            {
                "title": f"{target_role.title()} Roadmap Projects",
                "provider": "freeCodeCamp",
                "url": "https://www.freecodecamp.org",
                "duration": "8 weeks",
                "reason": "Builds portfolio-ready role-specific projects",
            },
        ],
    }

