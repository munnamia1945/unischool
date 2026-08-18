# UniSchool AI

**AI-powered learning and research assistant for students and researchers.**

UniSchool AI is a modern web-based educational platform that integrates Generative AI with academic learning and research workflows. The platform is designed to help students understand academic concepts, practice through automatically generated questions, create study notes, and analyze research materials.

The system combines an interactive learning environment with AI-assisted research capabilities, providing a unified workspace for both academic study and research activities.

---

## Overview

UniSchool AI is built around two primary areas:

1. **AI-powered Learning**
2. **AI-powered Research Assistance**

The learning environment focuses on concept understanding, practice, and revision, while the research environment provides tools for processing and analyzing academic materials.

The platform is designed with a modular architecture so that additional AI-powered educational and research features can be integrated in the future.

---

## Features

### AI Concept Explanation

Users can provide an academic topic or concept and receive an AI-generated explanation.

The system is designed to provide:

* Clear explanations of complex concepts
* Simplified descriptions
* Examples and analogies
* Important points
* Key takeaways
* Study-oriented explanations

This feature is intended to support students when reviewing unfamiliar or difficult academic topics.

### AI MCQ Generator

UniSchool AI can generate topic-based multiple-choice questions using Generative AI.

The generated questions include:

* Multiple answer choices
* Correct answers
* Explanations
* Interactive question answering
* Score calculation

This allows users to practice a topic without manually preparing question sets.

### Smart Notes

The platform can generate concise study notes from academic topics.

The notes are structured to help users with:

* Quick revision
* Important concepts
* Key definitions
* Main points
* Exam preparation

### Research Assistant

The Research Assistant provides an AI-assisted workflow for analyzing academic research materials.

Users can provide research content and generate a structured academic review containing areas such as:

* Abstract
* Key findings
* Methodology
* Critical analysis
* Strengths and limitations
* Conclusion
* Future research directions

The generated output can be further edited and used as a starting point for academic research workflows.

### PDF Research Analysis

The platform supports research-paper PDF processing.

PDF documents can be uploaded and their text can be extracted using PDF processing technologies. The extracted content can then be passed to the research analysis workflow.

This creates a workflow from:

```text
Research Paper
      ↓
PDF Upload
      ↓
Text Extraction
      ↓
AI Analysis
      ↓
Structured Research Review
```

### User Authentication

User authentication and account management are implemented using Supabase.

The platform supports:

* User registration
* Login
* Logout
* Persistent authentication
* User profiles
* Profile information management

### Learning History

The platform can maintain users' learning and examination history.

Stored information may include:

* Topic
* Score
* Total questions
* Date
* User information

This provides a foundation for future personalized learning analytics.

### Administrative Dashboard

UniSchool AI includes an administrative interface for managing and monitoring platform activity.

Administrative functionality includes:

* User management
* AI activity monitoring
* AI request logs
* Activity search
* Log management
* Platform statistics
* Usage analytics

Administrative functionality is restricted to authorized users.

---

## Technology Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS

### AI

* Google Gemini API

### Backend and Database

* Supabase
* PostgreSQL
* Supabase Authentication

### Supporting Libraries

* PDF.js
* React Markdown
* Recharts
* Motion
* Lucide React
* jsPDF
* html2canvas

---

## System Architecture

The platform follows a modular client-side architecture where different application features communicate with dedicated service and backend layers.

A simplified architecture is:

```text
                    UniSchool AI
                         |
          +--------------+--------------+
          |                             |
          v                             v
   Learning Module              Research Module
          |                             |
          |                             |
          v                             v
    Gemini AI Service            PDF Processing
          |                             |
          +-------------+---------------+
                        |
                        v
                  Google Gemini
                        |
                        v
                 AI Generated Output
                        |
             +----------+----------+
             |                     |
             v                     v
       User Interface        Research Output
                                   |
                            PDF / TXT / LaTeX
```

Supabase is used for authentication, user profiles, learning history, and application activity data.


## Security

Security is an important part of the platform, particularly because the application integrates external AI services and user accounts.

The project follows these principles:

* API credentials are stored through environment variables.
* Authentication is handled through Supabase.
* Administrative functionality is restricted to authorized users.
* Sensitive credentials should never be committed to GitHub.
* Production deployments should use appropriate Supabase Row Level Security policies.
* User-generated content should be validated before processing.
* API usage should be monitored and rate-limited where necessary.

---

## Future Development

UniSchool AI is designed to be extensible. Future development may include:

### Learning

* Personalized learning paths
* Adaptive quizzes
* Flashcard generation
* Spaced repetition
* Personalized study planning
* Topic-level performance analysis

### Research

* Multi-paper literature review
* Research paper comparison
* Citation extraction
* Research gap identification
* Research Question generation
* Proposed Idea generation
* Novel Contribution analysis
* Research methodology suggestions
* BibTeX generation
* Reference management

### Advanced AI

* Retrieval-Augmented Generation (RAG)
* Vector database integration
* Semantic research-paper search
* Document embeddings
* Multi-document analysis
* Citation-aware responses

These extensions can transform the platform from an AI learning assistant into a more comprehensive academic research environment.

---

## Intended Use

UniSchool AI is intended as an educational and research-support platform.

AI-generated content should be treated as an assistance tool rather than a replacement for academic judgment. Research outputs should be independently verified against the original sources before being used in formal academic work.

---

## Author

**MD MUNNA MIA**

Computer Science and Engineering
Bangladesh

---

## License

This project is currently developed for educational and research purposes.

The licensing terms may be updated as the project evolves.

---

**UniSchool AI — AI-assisted learning and research for the modern academic workflow.**
