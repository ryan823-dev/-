// All schemas converted from Gemini Type.* format to standard JSON Schema

export const icpSchema = {
  type: 'object',
  properties: {
    industryTags: { type: 'array', items: { type: 'string' } },
    targetCustomerTypes: { type: 'array', items: { type: 'string' } },
    targetTitles: { type: 'array', items: { type: 'string' } },
    queryPack: {
      type: 'object',
      properties: {
        google: { type: 'array', items: { type: 'string' } },
        linkedin: { type: 'array', items: { type: 'string' } },
        directories: { type: 'array', items: { type: 'string' } },
        tender: { type: 'array', items: { type: 'string' }, description: 'Procurement/tender search queries for government bidding platforms' }
      },
      required: ['google', 'linkedin', 'directories', 'tender']
    },
    signalPack: {
      type: 'object',
      properties: {
        regulation: { type: 'array', items: { type: 'string' }, description: 'Regulation/Violation keywords' },
        hiring: { type: 'array', items: { type: 'string' }, description: 'Job titles indicating pain' },
        expansion: { type: 'array', items: { type: 'string' }, description: 'Expansion/Construction keywords' },
        automation: { type: 'array', items: { type: 'string' }, description: 'Automation upgrade keywords' }
      },
      required: ['regulation', 'hiring', 'expansion', 'automation']
    },
    disqualifiers: { type: 'array', items: { type: 'string' } },
    scenarioPack: { type: 'array', items: { type: 'string' } }
  },
  required: ['industryTags', 'targetCustomerTypes', 'targetTitles', 'queryPack', 'signalPack', 'disqualifiers', 'scenarioPack']
};

export const knowledgeExtractionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', description: 'Offering, Company, or Proof' },
    title: { type: 'string' },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'string' },
          fieldKey: { type: 'string' }
        },
        required: ['label', 'value', 'fieldKey']
      }
    },
    completion: { type: 'number' },
    confidence: { type: 'number' },
    missingFields: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fieldKey: { type: 'string' },
          label: { type: 'string' },
          reason: { type: 'string' },
          impact: { type: 'string' }
        },
        required: ['fieldKey', 'label']
      }
    }
  },
  required: ['type', 'title', 'fields', 'completion', 'confidence']
};

export const contentGenerationSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    keywords: { type: 'array', items: { type: 'string' } },
    draftBody: { type: 'string' },
    generationTrace: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          paragraph: { type: 'string' },
          refs: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fieldLabel: { type: 'string' },
                fieldKey: { type: 'string' },
                cardTitle: { type: 'string' },
                sourceName: { type: 'string' }
              },
              required: ['fieldLabel', 'fieldKey', 'cardTitle']
            }
          }
        },
        required: ['paragraph', 'refs']
      }
    },
    missingInfoNeeded: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fieldKey: { type: 'string' },
          label: { type: 'string' },
          cardId: { type: 'string' }
        },
        required: ['fieldKey', 'label', 'cardId']
      }
    }
  },
  required: ['title', 'draftBody', 'generationTrace']
};

export const outreachSchema = {
  type: 'object',
  properties: {
    emailA: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        body: { type: 'string' },
        citedEvidenceIds: { type: 'array', items: { type: 'string' } }
      },
      required: ['subject', 'body']
    },
    emailB: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        body: { type: 'string' },
        citedEvidenceIds: { type: 'array', items: { type: 'string' } }
      },
      required: ['subject', 'body']
    },
    whatsapp: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        citedEvidenceIds: { type: 'array', items: { type: 'string' } }
      },
      required: ['message']
    }
  },
  required: ['emailA', 'emailB', 'whatsapp']
};

// Schema for tender discovery AI responses
export const tenderDiscoverySchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      tenderTitle: { type: 'string', description: 'Title of the procurement/tender opportunity' },
      issuingOrganization: { type: 'string', description: 'Organization posting the tender (NOT bidders)' },
      deadline: { type: 'string', description: 'Submission deadline in ISO format or descriptive text' },
      estimatedValue: { type: 'string', description: 'Contract value range, e.g., "€500K - €2M"' },
      requirements: { type: 'array', items: { type: 'string' }, description: 'Key qualification requirements' },
      url: { type: 'string', description: 'Direct link to tender details' },
      matchReason: { type: 'string', description: 'Why this tender matches the product/ICP' }
    },
    required: ['tenderTitle', 'issuingOrganization']
  }
};

// Schema for intelligent product export research
export const productResearchSchema = {
  type: 'object',
  properties: {
    productNameEN: { type: 'string', description: 'English name for the product' },
    productNameCN: { type: 'string', description: 'Original Chinese product name' },
    internationalTerms: {
      type: 'array',
      items: { type: 'string' },
      description: 'Alternative international terms/keywords for the product'
    },
    marketPositioning: {
      type: 'object',
      properties: {
        suggestedPosition: { type: 'string', description: 'e.g., premium, mid-range, value' },
        reasoning: { type: 'string' },
        targetRegions: { type: 'array', items: { type: 'string' } }
      },
      required: ['suggestedPosition', 'reasoning']
    },
    competitorAnalysis: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Competitor brand name' },
          country: { type: 'string' },
          strengths: { type: 'array', items: { type: 'string' } },
          priceRange: { type: 'string' },
          website: { type: 'string' }
        },
        required: ['name', 'country']
      }
    },
    certifications: {
      type: 'object',
      properties: {
        required: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Certification name, e.g., IATF 16949' },
              region: { type: 'string', description: 'Which market requires this' },
              importance: { type: 'string', enum: ['必备', '强烈建议', '加分项'] },
              estimatedTime: { type: 'string', description: 'Time to obtain' },
              estimatedCost: { type: 'string' }
            },
            required: ['name', 'region', 'importance']
          }
        },
        current: { type: 'array', items: { type: 'string' }, description: 'Certifications already held' },
        gaps: { type: 'array', items: { type: 'string' }, description: 'Missing critical certifications' }
      },
      required: ['required']
    },
    channels: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Channel name, e.g., ThomasNet, Kompass, Europages (NOT Alibaba/Made-in-China)' },
          type: { type: 'string', enum: ['行业目录', '行业展会', '独立站', '直销', '分销商', '社交销售', '招投标'] },
          region: { type: 'string' },
          priority: { type: 'string', enum: ['高', '中', '低'] },
          notes: { type: 'string' }
        },
        required: ['name', 'type', 'priority']
      }
    },
    exhibitions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          location: { type: 'string' },
          timing: { type: 'string' },
          relevance: { type: 'string' },
          website: { type: 'string' }
        },
        required: ['name', 'location']
      }
    },
    trends: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          trend: { type: 'string' },
          impact: { type: 'string' },
          opportunity: { type: 'string' },
          source: { type: 'string' }
        },
        required: ['trend', 'impact']
      }
    },
    differentiationStrategy: {
      type: 'object',
      properties: {
        uniqueSellingPoints: { type: 'array', items: { type: 'string' } },
        priceAdvantage: { type: 'string' },
        customizationCapability: { type: 'string' },
        suggestedApproach: { type: 'string' }
      },
      required: ['uniqueSellingPoints', 'suggestedApproach']
    },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          action: { type: 'string' },
          priority: { type: 'string', enum: ['P0', 'P1', 'P2'] },
          category: { type: 'string', enum: ['认证', '渠道', '展会', '产品优化', '营销'] },
          deadline: { type: 'string' }
        },
        required: ['action', 'priority', 'category']
      }
    }
  },
  required: ['productNameEN', 'productNameCN', 'marketPositioning', 'certifications', 'channels', 'differentiationStrategy', 'actionItems']
};
