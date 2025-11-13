# Math Quiz Application

A comprehensive web application for creating and taking mathematics quizzes with LaTeX support, intelligent answer evaluation, and step-by-step solution feedback. Built with React, TypeScript, and modern web technologies.

## 🎯 Overview

This application provides two main modes:
- **Author Mode**: Create math quizzes with various question types (MCQ, open-ended, fill-in-the-blank)
- **Student Mode**: Take quizzes with a built-in math keyboard and receive detailed feedback

## 🛠️ Technologies Used

### Core Framework & Language
- **React 19.2.0** - Modern React library for building user interfaces
- **TypeScript 5.9.3** - Type-safe JavaScript with static typing
- **Vite 7.2.2** - Fast build tool and development server with HMR (Hot Module Replacement)

### Routing
- **React Router DOM 7.9.5** - Client-side routing for single-page application navigation

### Math Rendering & Input
- **MathJax React 2.0.1** - React component for rendering LaTeX math expressions
- **MathQuill 0.10.1-a** - Visual math input editor with LaTeX output
- **React MathQuill 1.0.4** - React wrapper for MathQuill integration

### UI Components & Styling
- **Tailwind CSS 3.4.18** - Utility-first CSS framework for rapid UI development
- **PostCSS 8.5.6** - CSS processing tool
- **Autoprefixer 10.4.22** - Automatically adds vendor prefixes to CSS
- **Radix UI** - Headless UI component primitives:
  - `@radix-ui/react-dropdown-menu` - Accessible dropdown menu component
  - `@radix-ui/react-slot` - Flexible component composition utility
- **Lucide React 0.553.0** - Beautiful icon library
- **Class Variance Authority 0.7.1** - Utility for component variants
- **clsx 2.1.1** - Utility for constructing className strings conditionally
- **tailwind-merge 3.4.0** - Merge Tailwind CSS classes intelligently

### Backend & Evaluation
- **Supabase 2.81.1** - Backend-as-a-Service for database and edge functions
- **Supabase Edge Functions** - Serverless functions for AI-powered step evaluation
- **OpenAI GPT-4o-mini** - AI model for evaluating student working steps and providing feedback

### Development Tools
- **ESLint 9.39.1** - JavaScript/TypeScript linter
- **TypeScript ESLint 8.46.3** - TypeScript-specific linting rules
- **ESLint React Hooks Plugin** - React hooks linting rules
- **ESLint React Refresh Plugin** - Fast Refresh linting support

## ✨ Features

### Author Mode
- **Question Builder**: Create questions with multiple content blocks (text and math)
- **Question Types**:
  - **Multiple Choice Questions (MCQ)**: Create questions with multiple options
  - **Open-Ended Questions**: Students provide step-by-step solutions with final answers
  - **Fill-in-the-Blank Questions**: Students fill in blanks within math expressions
- **Segmented Math Editor**: Visual editor for creating fill-in-the-blank questions
- **Answer Box Management**: Define multiple answer boxes with labels and correct answers
- **MCQ Option Editor**: Create and mark correct options for multiple choice questions
- **Math Keyboard**: On-screen keyboard for easy math input during authoring
- **Quiz Management**: Save, edit, and delete quizzes with metadata

### Student Mode
- **Quiz Viewer**: Navigate through quiz questions with a clean interface
- **Math Input**: Use MathQuill editor for entering mathematical expressions
- **Built-in Math Keyboard**: On-screen keyboard with multiple modes:
  - Main mode: Numbers, operators, common math symbols
  - ABC mode: Alphabetical characters
  - Functions mode: Mathematical functions (sin, cos, log, etc.)
  - Symbols mode: Special mathematical symbols
- **Working Steps**: For open-ended questions, students can add multiple working steps
- **Real-time Math Rendering**: LaTeX expressions rendered beautifully using MathJax
- **Answer Evaluation**: Intelligent evaluation system that:
  - Compares mathematical expressions (handles equivalent forms)
  - Evaluates working steps using AI (OpenAI GPT-4o-mini)
  - Provides partial credit for correct steps even if final answer is wrong
  - Generates correct solution steps when student answer is incorrect

### Evaluation System
- **Smart Math Comparison**: Normalizes and compares LaTeX expressions accounting for:
  - Different multiplication symbols (×, ·, *)
  - Whitespace variations
  - Equivalent equation forms
  - Multiple answer formats
- **AI-Powered Step Evaluation**: 
  - Evaluates each working step independently
  - Provides feedback on mathematical correctness
  - Awards partial marks based on correct steps
  - Generates correct solution steps when needed
- **Mark Allocation**: 
  - Configurable marks per question
  - Proportional marking for fill-in-the-blank questions
  - Partial credit system for open-ended questions (70% steps, 30% final answer)
- **Detailed Results**: 
  - Per-question feedback
  - Step-by-step evaluation
  - Overall quiz score and percentage
  - Total marks awarded vs maximum marks

### Data Storage
- **Local Storage**: Quizzes stored in browser's localStorage
- **Quiz Metadata**: Tracks creation date, update date, and question count

## 📁 Project Structure

```
math-type/
├── src/
│   ├── components/
│   │   ├── authoring/          # Author mode components
│   │   │   ├── AnswerBox.tsx           # Answer box editor
│   │   │   ├── BlockSelector.tsx       # Content block type selector
│   │   │   ├── MCQOptionEditor.tsx     # MCQ option editor
│   │   │   ├── QuestionBlock.tsx       # Individual question block display
│   │   │   ├── QuestionBuilder.tsx     # Main question builder interface
│   │   │   └── SegmentedMathEditor.tsx # Fill-in-the-blank editor
│   │   ├── shared/             # Shared components
│   │   │   ├── MathDisplay.tsx         # Math rendering component
│   │   │   ├── MathInput.tsx           # Math input editor
│   │   │   └── MathKeyboard.tsx        # On-screen math keyboard
│   │   ├── student/            # Student mode components
│   │   │   ├── QuestionDisplay.tsx     # Question display component
│   │   │   ├── QuizResults.tsx         # Results display
│   │   │   └── QuizViewer.tsx          # Main quiz taking interface
│   │   ├── ui/                 # Reusable UI components
│   │   │   ├── button.tsx              # Button component
│   │   │   ├── dropdown-menu.tsx       # Dropdown menu component
│   │   │   └── input.tsx               # Input component
│   │   └── ErrorBoundary.tsx   # Error boundary for React
│   ├── pages/                  # Page components
│   │   ├── HomePage.tsx        # Landing page
│   │   ├── AuthoringPage.tsx   # Author mode page
│   │   └── StudentPage.tsx     # Student mode page
│   ├── utils/                  # Utility functions
│   │   ├── blanks.ts           # Fill-in-the-blank utilities
│   │   ├── createSampleQuiz.ts # Sample quiz generator
│   │   ├── evaluation.ts       # Answer evaluation logic
│   │   ├── storage.ts          # Local storage utilities
│   │   ├── supabase-edge.ts    # Supabase edge function client
│   │   └── supabase.ts         # Supabase client setup
│   ├── lib/
│   │   └── utils.ts            # General utilities (cn function)
│   ├── types.ts                # TypeScript type definitions
│   ├── App.tsx                 # Main app component with routing
│   ├── main.tsx                # Application entry point
│   └── index.css               # Global styles
├── supabase/
│   └── functions/
│       └── evaluate-steps/     # Edge function for AI evaluation
│           └── index.ts        # Step evaluation endpoint
├── public/                     # Static assets
├── dist/                       # Build output
├── scripts/                    # Utility scripts
│   └── create-gcse-quiz-browser.js
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
└── eslint.config.js            # ESLint configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd math-type
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (if using Supabase):
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Deploy Supabase Edge Function (for AI evaluation):
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Deploy the edge function
supabase functions deploy evaluate-steps
```

5. Configure OpenAI API Key in Supabase:
   - Go to your Supabase project dashboard
   - Navigate to Edge Functions → Secrets
   - Add `OPENAI_API_KEY` with your OpenAI API key

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in terminal).

### Building for Production

Build the application:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Linting

Run ESLint to check for code issues:
```bash
npm run lint
```

## 📖 Usage

### Creating a Quiz (Author Mode)

1. Navigate to the Author Mode from the home page
2. Enter a quiz title
3. Click "Add Question" to create a new question
4. Select question type (MCQ, Open-ended, or Fill-in-the-Blank)
5. Add content blocks (text or math) using the block selector
6. For MCQ: Add options and mark the correct one
7. For Open-ended: Add answer boxes with labels and correct answers
8. For Fill-in-the-Blank: Use the segmented math editor to create blanks
9. Save the question and repeat for additional questions
10. Click "Save Quiz" when finished

### Taking a Quiz (Student Mode)

1. Navigate to Student Mode from the home page
2. Select a quiz from the available quizzes list
3. Read each question carefully
4. Use the math keyboard (in author mode) or MathQuill editor to enter answers
5. For open-ended questions, add working steps before providing final answers
6. Navigate between questions using Previous/Next buttons
7. Submit the quiz when all questions are answered
8. Review detailed results including:
   - Correct/incorrect answers
   - Step-by-step evaluation (for open-ended questions)
   - Marks awarded
   - Overall score and percentage

## 🎨 UI Components

The application uses a custom UI component library built on:
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **Class Variance Authority** for component variants
- **Lucide React** for icons

Components follow a consistent design system with:
- Dark mode support (via CSS variables)
- Responsive design
- Accessible interactions
- Smooth animations and transitions

## 🔧 Configuration

### Vite Configuration
- Path aliases: `@/` maps to `src/`
- MathQuill excluded from optimization (due to CommonJS)
- Global polyfill for compatibility

### TypeScript Configuration
- Strict type checking enabled
- Path aliases configured
- React JSX support

### Tailwind Configuration
- Custom color system using CSS variables
- Responsive breakpoints
- Custom border radius utilities

## 📝 Type Definitions

The application uses comprehensive TypeScript types defined in `src/types.ts`:
- `QuestionBlock`: Text or math content blocks
- `Question`: Complete question structure with type-specific fields
- `Quiz`: Quiz container with metadata
- `EvaluationResult`: Per-question evaluation results
- `QuizEvaluation`: Complete quiz evaluation results
- `StepEvaluation`: Individual step evaluation for open-ended questions

## 🤖 AI Evaluation

The application uses OpenAI's GPT-4o-mini model to:
- Evaluate mathematical working steps
- Determine if steps are mathematically correct
- Provide feedback on each step
- Generate correct solution steps when student answer is wrong
- Consider mark allocation when evaluating

The evaluation is done via a Supabase Edge Function that:
- Receives question, student steps, and answers
- Constructs a detailed prompt for the AI
- Returns structured evaluation results
- Handles errors gracefully

## 🧪 Sample Quiz

The application includes a sample GCSE Math quiz generator (`createSampleQuiz.ts`) that creates:
- 3 sample questions covering different topics
- Various question types
- Demonstrates the application's capabilities

## 🔒 Security Notes

- API keys should be stored as environment variables
- Supabase Edge Functions handle API key management securely
- Local storage is used for quiz data (consider backend storage for production)

## 📄 License

[Add your license information here]

## 🤝 Contributing

[Add contribution guidelines if applicable]

## 📧 Contact

[Add contact information if desired]
