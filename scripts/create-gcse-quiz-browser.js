// Run this script in the browser console to create and save the GCSE quiz
// Copy and paste this entire script into the browser console when the app is running

(function() {
  const STORAGE_KEY = 'math-quiz-app-quizzes';
  
  function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  function getAllQuizzes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading quizzes:', error);
      return [];
    }
  }

  function saveQuiz(quiz) {
    const quizzes = getAllQuizzes();
    const existingIndex = quizzes.findIndex(q => q.id === quiz.id);
    
    const updatedQuiz = {
      ...quiz,
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      quizzes[existingIndex] = updatedQuiz;
    } else {
      updatedQuiz.createdAt = new Date().toISOString();
      quizzes.push(updatedQuiz);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(quizzes));
  }

  // Create Open-ended Question: Solve a quadratic equation
  const openEndedQuestion = {
    id: generateId(),
    instruction: 'Solve the equation',
    questionType: 'open-ended',
    blocks: [
      {
        id: generateId(),
        type: 'math',
        content: 'x^2 + 5x + 6 = 0'
      }
    ],
    answerBoxes: [
      {
        id: generateId(),
        label: 'x',
        labelIsMath: false,
        answer: '-2, -3'
      }
    ]
  };

  // Create Fill-in-the-Blank Question: Complete the equation
  const fillInTheBlankQuestion = {
    id: generateId(),
    instruction: 'Fill in the blanks to complete the equation',
    questionType: 'fill-in-the-blank',
    blocks: [],
    segmentedElements: [
      { type: 'math', value: '(x + ', id: generateId() },
      { type: 'blank', id: 1 },
      { type: 'math', value: ')(x + ', id: generateId() },
      { type: 'blank', id: 2 },
      { type: 'math', value: ') = x^2 + 7x + 12', id: generateId() }
    ],
    answerBoxes: [
      {
        id: generateId(),
        label: 'Blank #1',
        labelIsMath: false,
        answer: '3'
      },
      {
        id: generateId(),
        label: 'Blank #2',
        labelIsMath: false,
        answer: '4'
      }
    ]
  };

  // Create MCQ Question: What is the value of x?
  const mcqQuestion = {
    id: generateId(),
    instruction: 'What is the value of x in the equation?',
    questionType: 'mcq',
    blocks: [
      {
        id: generateId(),
        type: 'math',
        content: '2x + 8 = 20'
      }
    ],
    mcqOptions: [
      {
        id: generateId(),
        label: 'x = 4',
        isCorrect: false
      },
      {
        id: generateId(),
        label: 'x = 6',
        isCorrect: true
      },
      {
        id: generateId(),
        label: 'x = 8',
        isCorrect: false
      },
      {
        id: generateId(),
        label: 'x = 10',
        isCorrect: false
      }
    ]
  };

  // Create the quiz
  const quiz = {
    id: generateId(),
    title: 'GCSE Math Practice Questions',
    questions: [openEndedQuestion, fillInTheBlankQuestion, mcqQuestion],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Save the quiz
  saveQuiz(quiz);

  console.log('✅ Successfully created and saved GCSE Math quiz with 3 questions:');
  console.log('  1. Open-ended: Solve x² + 5x + 6 = 0');
  console.log('  2. Fill-in-the-blank: Complete the factorization (x + _)(x + _) = x² + 7x + 12');
  console.log('  3. Multiple Choice: Solve 2x + 8 = 20');
  console.log('\nQuiz ID:', quiz.id);
  console.log('Quiz Title:', quiz.title);
  console.log('\nYou can now view this quiz in the Student page!');
})();

