import { PackManifest } from '../../core/contracts';
import { SNARAI_IDENTITY } from './identity';
import { SNARAI_GOALS } from './goals';
import { SNARAI_MISSIONS } from './missions';
import { SNARAI_ACTIONS } from './actions';
import { SNARAI_KNOWLEDGE } from './knowledge';

export const SNARAI_PACK: PackManifest = {
  id: 'snarai',
  name: 'S\'Narai',
  version: '1.0.0',
  type: 'organization-pack',
  
  requires: [
    'openai',
    'telegram',
    'knowledge'
  ],
  provides: [
    'patrimonial-advisor',
    'commercial-agent'
  ],

  identity: SNARAI_IDENTITY,
  knowledge: SNARAI_KNOWLEDGE,
  
  goals: SNARAI_GOALS,
  missions: SNARAI_MISSIONS,
  actions: SNARAI_ACTIONS,

  lifecycle: {
    onInstall: [
      'create_default_goals'
    ],
    onActivate: [
      'initialize_mission_templates'
    ]
  }
};
