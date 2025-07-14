import type { DatasetStructure } from '../models/index'

// Sample dataset in the new format
export const SAMPLE_DATASET: DatasetStructure = {
  context: {
    course: 'Sciences Générales',
    level: 'Niveau 1',
    date: '2025-01-14',
  },
  questionList: [
    {
      id: 1,
      question: 'Quelle est la capitale de la France?',
      referenceAnswer: 'Paris',
      difficulty: 'easy',
      context: {
        topic: 'Géographie',
        category: 'Capitales européennes',
      },
    },
    {
      id: 2,
      question: 'Quelle est la plus grande planète de notre système solaire?',
      referenceAnswer: 'Jupiter',
      difficulty: 'medium',
      context: {
        topic: 'Astronomie',
        category: 'Système solaire',
      },
    },
    {
      id: 3,
      question: 'Quel est le symbole chimique de l\'or?',
      referenceAnswer: 'Au',
      difficulty: 'hard',
      context: {
        topic: 'Chimie',
        category: 'Éléments chimiques',
      },
    },
  ],
  items: [
    {
      id: 1,
      questionID: 1,
      submittedAnswer: 'Paris',
      context: {
        studentId: 'student_001',
        timestamp: '2025-01-14T10:00:00Z',
      },
    },
    {
      id: 2,
      questionID: 2,
      submittedAnswer: 'Jupiter',
      context: {
        studentId: 'student_001',
        timestamp: '2025-01-14T10:01:00Z',
      },
    },
    {
      id: 3,
      questionID: 3,
      submittedAnswer: 'Au',
      context: {
        studentId: 'student_001',
        timestamp: '2025-01-14T10:02:00Z',
      },
    },
    {
      id: 4,
      questionID: 1,
      submittedAnswer: 'Berlin',
      context: {
        studentId: 'student_002',
        timestamp: '2025-01-14T10:00:00Z',
      },
    },
    {
      id: 5,
      questionID: 2,
      submittedAnswer: 'Saturne',
      context: {
        studentId: 'student_002',
        timestamp: '2025-01-14T10:01:00Z',
      },
    },
    {
      id: 6,
      questionID: 3,
      submittedAnswer: 'Ag',
      context: {
        studentId: 'student_002',
        timestamp: '2025-01-14T10:02:00Z',
      },
    },
  ],
}
