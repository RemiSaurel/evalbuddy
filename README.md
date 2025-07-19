# 🧑‍🏫 EvalBuddy

A modern, flexible evaluation platform for educational assessments and question grading.

## 📋 Overview

EvalBuddy is a web-based application built with Nuxt 3 that provides educators with a comprehensive tool for evaluating responses to questions. The platform supports multiple evaluation methodologies, from simple binary assessments to complex mastery-level evaluations with custom scoring systems. The tool uses [IndexedDB](https://developer.mozilla.org/fr/docs/Web/API/IndexedDB_API/Using_IndexedDB) for local data storage, ensuring fast and reliable performance with 100% local data handling.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd evalbuddy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   Open your browser to `http://localhost:3000`

### Building for Production

```bash
# Build for production
npm run build

# Generate static files
npm run generate

# Preview production build
npm run preview
```

## 📖 Usage Guide

### Creating Evaluation Configurations

1. Navigate to the **Configurations** page
2. Click **New Configuration**
3. Choose your evaluation type:
   - **Mastery Levels**: For competency-based assessment
   - **Correct/Incorrect**: For simple binary evaluation
   - **Numeric Score**: For point-based grading
4. Configure settings specific to your chosen type
5. Set comment requirements (optional/required/disabled)

### Setting Up an Evaluation Session

1. From the home page, click **Create Evaluation**
2. Select an evaluation configuration (or use default)
3. Import a JSON file containing your questions
4. The session will be created and ready for evaluation

### Dataset File Format

Datasets should be provided as a JSON object with the following structure:

```json
{
  "context": {
    "course": "Geography Assessment",
    "level": "Intermediate",
    "date": "2025-01-14",
    "instructor": "Prof. Smith"
  },
  "questionList": [
    {
      "id": 1,
      "question": "What is the capital of France?",
      "referenceAnswer": "The capital of France is Paris.",
      "difficulty": "easy",
      "context": {
        "topic": "European Geography",
        "points": "10",
        "categories": ["Capitals", "Geography", "Basic Knowledge"]
      }
    }
  ],
  "items": [
    {
      "id": 1,
      "questionID": 1,
      "submittedAnswer": "Paris is the capital of France.",
      "context": {
        "studentId": "student_001",
        "studentName": "Alice Johnson",
        "submissionTime": "2025-01-14T10:00:00Z",
        "attempt": "1"
      }
    }
  ]
}
```

**Dataset Structure:**
- `context`: Optional metadata about the dataset (course info, dates, etc.)
- `questionList`: Array of question definitions
- `items`: Array of evaluation items (student submissions)

**Question Fields:**
- `id`: Unique identifier for the question (number)
- `question`: The question text
- `referenceAnswer`: The correct/expected answer
- `difficulty`: Optional - one of "easy", "medium", or "hard"
- `context`: Optional metadata (supports string and string[] values for better display)

**Evaluation Item Fields:**
- `id`: Unique identifier for the evaluation item (number)
- `questionID`: References the question this item belongs to
- `submittedAnswer`: The student's submitted answer
- `context`: Optional metadata (supports string and string[] values for better display)

### Evaluating Questions

1. Open an evaluation session
2. Review each question and the submitted answer
3. Select your evaluation (mastery level, score, or boolean)
4. Add comments if enabled
5. Navigate between questions using the question navigator
6. Track progress with the built-in progress indicators

## 🌍 Internationalization

The application supports multiple languages through Vue I18n:

- **English** (`en`): Complete translation
- **French** (`fr`): Complete translation (default)

To add a new language:
1. Create a new locale file in `i18n/locales/`
2. Add the locale configuration in `nuxt.config.ts`
3. Translate all required keys

## 📄 License

This project is licensed under the terms specified in the LICENSE file.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or support, please open an issue in the repository.
