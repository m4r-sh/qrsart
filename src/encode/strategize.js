import { ECLS } from "../utils/ecls.js";
import { MODES } from "../utils/modes.js";
import { getNumDataCodewords, getNumRawDataModules } from "../utils/versions.js";

export function findMinimumVersion(str,minVersion=1,maxVersion=40,minEcl=0,minSurplus=0){
  let version = minVersion;
  let strat;

  for (; version <= maxVersion; version++) {
    if(version == minVersion || version == 10 || version == 27){
      strat = minStrategy(str, version);
    }
    const dataCapacityBits = getNumDataCodewords(version, minEcl) * 8;
    if (strat.cost <= dataCapacityBits - minSurplus) break;
  }

  if (!strat || (strat.cost > getNumDataCodewords(version, minEcl) * 8 - minSurplus || version > maxVersion)) {
    throw new Error('Data too long');
  }

  return [strat,version]
}


export function* allStrategies(str, version, ecl) {
  const chars = Array.from(str);        // ← ONE-TIME FIX
  const n = chars.length;

  const dataCapacityBits = getNumDataCodewords(version, ecl) * 8;

  // Precompute min char cost for each position
  const minCharCosts = new Array(n);
  for (let i = 0; i < n; i++) {
    let minC = Infinity;
    const c = chars[i];
    for (const mode of [0, 1, 2]) {
      const cost = MODES[mode].charCost(c);
      if (cost < minC) minC = cost;
    }
    minCharCosts[i] = minC === Infinity ? 0 : minC;
  }

  // Precompute cumulative min remaining cost
  const cumMinRemaining = new Array(n + 1).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    cumMinRemaining[i] = cumMinRemaining[i + 1] + minCharCosts[i];
  }

  const stack = [{ index: 0, strategy: new StrategyNode() }];

  while (stack.length) {
    const { index, strategy } = stack.pop();

    if (index === n) {
      strategy.cost = Math.ceil(strategy.cost);
      yield strategy.getStrategy();
      continue;
    }

    const estimatedRemainingCost = cumMinRemaining[index + 1];
    const c = chars[index];

    for (const mode of [2, 1, 0]) {
      const charCost = MODES[mode].charCost(c);
      if (charCost === Infinity) continue;

      if (MODES[mode].name === strategy.mode) {
        const newCost = strategy.cost + charCost;
        if (newCost <= dataCapacityBits - estimatedRemainingCost) {
          stack.push({
            index: index + 1,
            strategy: strategy.extendMode(newCost)
          });
        }
      }

      const headerBits = 4 + MODES[mode].numCharCountBits(version);
      const newCost = Math.ceil(strategy.cost) + headerBits + charCost;
      if (newCost <= dataCapacityBits - estimatedRemainingCost) {
        stack.push({
          index: index + 1,
          strategy: strategy.switchMode(MODES[mode].name, newCost)
        });
      }
    }
  }
}



const modeNames = ['byte','numeric','alpha','kanji']

const MAX_GROUP_SIZE = 3;
const NUM_MODES = 12; // Includes 'none' and reserve for 'kanji'
const NUM_STATES = NUM_MODES * MAX_GROUP_SIZE;

const localmodes = {
  'numeric': MODES[0],
  'alpha': MODES[1],
  'byte': MODES[2],
  'kanji': MODES[3]
}

const modeToIdx = {
  'none': 0,
  'byte': 1,
  'numeric': 2,
  'alpha': 3,
  'kanji': 4, // Reserved, not used yet
};

const idxToMode = [];
idxToMode[modeToIdx['none']] = 'none';
idxToMode[modeToIdx['byte']] = 'byte';
idxToMode[modeToIdx['numeric']] = 'numeric';
idxToMode[modeToIdx['alpha']] = 'alpha';
idxToMode[modeToIdx['kanji']] = 'kanji';


export function naiveStrategy(str, version=1, single_mode=null){
  const chars = Array.from(str)
  const n = chars.length
  let cost = 0

  if(single_mode){
    let curmode = localmodes[single_mode]
    if(!curmode) throw new Error(`Unknown mode: ${single_mode}`);
    const headerBits = 4 + curmode.numCharCountBits(version)
    cost += headerBits
    for(let i = 0; i < n; i++){
      let c = chars[i]
      let added = curmode.getMarginal(c, i)
      if(added == Infinity) throw new Error(`Character cannot be encoded in ${single_mode} mode`);
      cost += added
    }
    return new Strategy(cost, [[single_mode, n]])
  }

  let mode = 'byte';
  if(n > 0){
    if(chars.every(c => localmodes.numeric.getMarginal(c, 0) !== Infinity)){
      mode = 'numeric';
    } else if(chars.every(c => localmodes.alpha.getMarginal(c, 0) !== Infinity)){
      mode = 'alpha';
    }
  }
  return naiveStrategy(str, version, mode);
}

export function minStrategy(str, version = 1) {
  const chars = Array.from(str);    // ← ONE-TIME FIX
  const n = chars.length;

  let prevStates = new Array(NUM_STATES).fill(null);

  let minCostPrevStrategy = new StrategyNode();
  prevStates[modeToIdx['none'] * MAX_GROUP_SIZE] = minCostPrevStrategy;

  for (let i = 1; i <= n; i++) {
    const c = chars[i - 1];
    const currStates = new Array(NUM_STATES).fill(null);

    // Extend existing segments
    for (let s = 0; s < NUM_STATES; s++) {
      const prev = prevStates[s];
      if (!prev) continue;

      const prevModeIdx = Math.floor(s / MAX_GROUP_SIZE);
      const prevMode = idxToMode[prevModeIdx];
      if (prevMode === 'none') continue;

      const curmode = localmodes[prevMode];
      const prevPhase = s % MAX_GROUP_SIZE;
      const addedBits = curmode.getMarginal(c, prevPhase);

      if (addedBits !== Infinity) {
        const newPhase = (prevPhase + 1) % curmode.groupSize;
        const newState = modeToIdx[prevMode] * MAX_GROUP_SIZE + newPhase;
        const newCost = prev.cost + addedBits;

        const existing = currStates[newState];
        if (!existing || newCost < existing.cost) {
          currStates[newState] = prev.extendMode(newCost);
        }
      }
    }

    // Switch to new segment
    if (minCostPrevStrategy) {
      for (const mode of modeNames) {
        const curmode = localmodes[mode];
        const initialBits = curmode.getMarginal(c, 0);
        if (initialBits === Infinity) continue;

        const headerBits = 4 + curmode.numCharCountBits(version);
        const newCost = minCostPrevStrategy.cost + headerBits + initialBits;
        const newPhase = 1 % curmode.groupSize;
        const newState = modeToIdx[mode] * MAX_GROUP_SIZE + newPhase;

        const existing = currStates[newState];
        if (!existing || newCost < existing.cost) {
          currStates[newState] = minCostPrevStrategy.switchMode(mode, newCost);
        }
      }
    }

    // Select best current strategy
    let best = null;
    let minCost = Infinity;
    for (const state of currStates) {
      if (state && state.cost < minCost) {
        minCost = state.cost;
        best = state;
      }
    }

    minCostPrevStrategy = best;
    prevStates = currStates;
  }

  return minCostPrevStrategy.getStrategy(true);
}

class StrategyNode {
  constructor(prev = null, mode = '', cost = 0, is_new = true) {
    this.prev = prev;
    this.mode = mode;
    this.cost = cost;
    this.is_new = is_new
  }

  extendMode(newCost){
    return new StrategyNode(this,this.mode,newCost, false)
  }

  switchMode(newMode,newCost){
    return new StrategyNode(this,newMode,newCost, true)
  }
  
  getStrategy(clear=false){
    const perChar = [];
    let cur = this;
    while (cur.prev) {
      perChar.push([ cur.mode, cur.is_new ]);
      cur = cur.prev;
    }

    const steps = [];
    let curStep = null
    for(let i = perChar.length - 1; i >= 0; i--){
      const [mode, isNew] = perChar[i]
      if(isNew){
        if(curStep){ steps.push(curStep) }
        curStep = [mode,1]
      } else {
        curStep[1] = curStep[1]+1
      }
    }
    if(curStep){ steps.push(curStep) }
    if(clear){ this.prev = null }
    return new Strategy(this.cost,steps);
  }
  
}

export class Strategy {
  constructor(cost=0,steps=[]){
    this.cost = cost
    this.steps = steps
  }
}
