import { SupportContext, SupportQuickAction } from '../types';

export const buildSupportWelcomeMessage = (context: SupportContext) => {
  const { role, module } = context;

  if (role === 'carrier') {
    if (module === 'deals') {
      return 'Hi, I’m your AI support assistant. I can help you understand request statuses, prepare offers, and guide your next steps in Deals.';
    }

    if (module === 'jobs') {
      return 'Hi, I’m your AI support assistant. I can help you with job assignments, delivery flow, and job status questions.';
    }

    if (module === 'inspections') {
      return 'Hi, I’m your AI support assistant. I can help you review inspections, repair steps, and approval flow.';
    }

    if (module === 'projects') {
      return 'Hi, I’m your AI support assistant. I can help you with project setup, resources, routes, and checklist flow.';
    }

    return 'Hi, I’m your AI support assistant. I can help you with deals, jobs, inspections, and project setup.';
  }

  if (role === 'finder') {
    return 'Hi, I’m your AI support assistant. I can help you with requests, offers, project flow, and follow-up actions.';
  }

  return 'Hi, I’m your AI support assistant. I can help you with assigned jobs, inspections, route steps, and delivery flow.';
};

export const buildSupportQuickActions = (
  context: SupportContext,
): SupportQuickAction[] => {
  const { role, module } = context;

  if (role === 'carrier' && module === 'deals') {
    return [
      {
        id: 'deals-1',
        label: 'Explain this status',
        prompt: 'Explain the current request status and what I should do next.',
      },
      {
        id: 'deals-2',
        label: 'Help me prepare an offer',
        prompt: 'Guide me to prepare an offer for this request.',
      },
      {
        id: 'deals-3',
        label: 'What should I review?',
        prompt: 'Tell me what I should review before submitting this offer.',
      },
    ];
  }

  if (role === 'carrier' && module === 'jobs') {
    return [
      {
        id: 'jobs-1',
        label: 'Explain this job status',
        prompt: 'Explain the current status of this job and the next expected step.',
      },
      {
        id: 'jobs-2',
        label: 'Assigned resources',
        prompt: 'Explain what resources I should verify for this job.',
      },
      {
        id: 'jobs-3',
        label: 'Delivery flow',
        prompt: 'Explain the pickup and delivery flow for this job.',
      },
    ];
  }

  if (role === 'carrier' && module === 'inspections') {
    return [
      {
        id: 'insp-1',
        label: 'Explain inspection status',
        prompt: 'Explain this inspection status and the next step.',
      },
      {
        id: 'insp-2',
        label: 'Review checklist help',
        prompt: 'Help me understand what I should review in this inspection.',
      },
      {
        id: 'insp-3',
        label: 'Repair guidance',
        prompt: 'Guide me through the repair review process.',
      },
    ];
  }

  if (role === 'carrier' && module === 'projects') {
    return [
      {
        id: 'proj-1',
        label: 'Project setup help',
        prompt: 'Help me understand the next steps in this project setup.',
      },
      {
        id: 'proj-2',
        label: 'Resources guidance',
        prompt: 'Explain what resources I should verify in this project.',
      },
      {
        id: 'proj-3',
        label: 'Routes and checklist',
        prompt: 'Explain how routes and checklist fit in this project flow.',
      },
    ];
  }

  if (role === 'finder') {
    return [
      {
        id: 'finder-1',
        label: 'Explain this request',
        prompt: 'Explain this request and the next action I should take.',
      },
      {
        id: 'finder-2',
        label: 'Offer guidance',
        prompt: 'Help me review the current offers and next steps.',
      },
      {
        id: 'finder-3',
        label: 'Project guidance',
        prompt: 'Help me understand the project flow from here.',
      },
    ];
  }

  return [
    {
      id: 'driver-1',
      label: 'What should I do next?',
      prompt: 'Explain what I should do next in my current flow.',
    },
    {
      id: 'driver-2',
      label: 'Inspection help',
      prompt: 'Help me understand the inspection process and next step.',
    },
    {
      id: 'driver-3',
      label: 'Delivery guidance',
      prompt: 'Explain the pickup and delivery steps for my assigned work.',
    },
  ];
};