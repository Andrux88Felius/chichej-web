import {readPromotions} from './promotions-firebase.js';
import {getSession} from './auth-firebase.js';
import {mountPromotions} from './promotions-view.js';
await mountPromotions(readPromotions,getSession);
