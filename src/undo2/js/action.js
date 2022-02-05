// ActionHandler works as follows

import { createLogger } from "shapez/core/logging";


const logger = createLogger("MOD: Undo-Redo");

export class GroupAction {
    constructor(actions) {
        this.actions = actions;
    }

    addAction(action) {
        this.actions.push(action);
    }
    
    removeAction(action) {
        this.actions = this.actions.filter(a => action !== action);
    }

    init() {
        return;
    }

    undo() {
        for(let i = this.actions.length - 1; i > -1; i--)
            this.actions[i].undo();
    }

    redo() {
        for(let i = 0; i < this.actions.length; i++)
            this.actions[i].redo();
    }
}

export class ActionHandler {
    constructor() {
        this.actions = [];
        this.currentPos = -1; // Where we are in the array
        this.maxSize = 20;
        this.currentlyGrouping = -1;
        this.currentGroups = [];
    }

    startGroupAction() {
        this.currentlyGrouping++;
        this.currentGroups.push(new GroupAction([]));
    }

    endGroupAction() {
        this.currentlyGrouping--;;
        const oldGroup = this.currentGroups.pop();
        this.currentGroup = null;
        return oldGroup;
    }

    removeLastAction() {
        this.actions.splice(this.currentPos, 1);
        this.currentPos--;
    }

    removeAllActions() {
        this.actions = [];
        this.currentPos = -1;
    }

    initAction(action) {
        if(this.currentlyGrouping > -1){
            this.currentGroups[this.currentlyGrouping].addAction(action);
            const result = action.init();
            return result;
        }
        this.actions = this.actions.slice(0, this.currentPos + 1); // Delete future history after we change something
        const result = action.init();
        this.actions.push(action);
        if(this.actions.length > this.maxSize) this.actions.shift();
        else this.currentPos++;

        return result;
    }

    undoAction() {
        if(this.currentPos < 0) return logger.log("Nothing to undo");
        const action = this.actions[this.currentPos];
        action.undo();
        this.currentPos--;

    }

    redoAction() {
        if(this.currentPos === this.actions.length - 1) return logger.log("Nothing to Redo");
        this.currentPos++;
        const action = this.actions[this.currentPos];
        action.redo();

    }
}


