import { getProfileEditor } from './profile-edit-firebase.js';
import { getSession } from './auth-firebase.js';
import { mountProfileEdit } from './profile-edit-view.js';

await mountProfileEdit(getProfileEditor, getSession);
