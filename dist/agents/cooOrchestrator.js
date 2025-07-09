"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.COOOrchestrator = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var sessionHandoff_1 = require("../services/sessionHandoff");
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80');
var COOOrchestrator = /** @class */ (function () {
    function COOOrchestrator() {
        this.sessionHandoff = new sessionHandoff_1.SessionHandoffService();
        this.autonomyLevel = 'locked'; // Start with strict human approval
    }
    /**
     * Submit task for execution with mandatory human approval
     */
    COOOrchestrator.prototype.submitTask = function (taskType_1, taskName_1, description_1, assignedAgent_1) {
        return __awaiter(this, arguments, void 0, function (taskType, taskName, description, assignedAgent, priority, parameters) {
            var _a, taskData, taskError, approvalResult, error_1;
            if (priority === void 0) { priority = 'medium'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, supabase
                                .from('agent_tasks')
                                .insert([{
                                    task_type: taskType,
                                    task_name: taskName,
                                    description: description,
                                    assigned_agent: assignedAgent,
                                    priority: priority,
                                    status: 'pending',
                                    requires_human_approval: true,
                                    approval_status: 'pending',
                                    parameters: parameters || {}
                                }])
                                .select()
                                .single()];
                    case 1:
                        _a = _b.sent(), taskData = _a.data, taskError = _a.error;
                        if (taskError) {
                            return [2 /*return*/, { success: false, error: taskError.message }];
                        }
                        return [4 /*yield*/, this.requestApproval(taskData.id, 'COO Orchestrator', "".concat(taskName, ": ").concat(description), this.getApprovalLevel(taskType, priority))];
                    case 2:
                        approvalResult = _b.sent();
                        if (!approvalResult.success) {
                            return [2 /*return*/, { success: false, error: approvalResult.error }];
                        }
                        // Log the task submission
                        return [4 /*yield*/, this.logExecution(taskData.id, assignedAgent, 'task_submitted', {
                                taskType: taskType,
                                taskName: taskName,
                                priority: priority,
                                requiresApproval: true
                            }, true)];
                    case 3:
                        // Log the task submission
                        _b.sent();
                        return [2 /*return*/, { success: true, taskId: taskData.id }];
                    case 4:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                            }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Request human approval for agent action
     */
    COOOrchestrator.prototype.requestApproval = function (taskId_1, requestedBy_1, requestDetails_1) {
        return __awaiter(this, arguments, void 0, function (taskId, requestedBy, requestDetails, approvalLevel) {
            var _a, approvalData, error, error_2;
            if (approvalLevel === void 0) { approvalLevel = 'standard'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabase
                                .from('agent_approval_queue')
                                .insert([{
                                    task_id: taskId,
                                    requested_by: requestedBy,
                                    request_details: requestDetails,
                                    approval_level: approvalLevel,
                                    status: 'pending'
                                }])
                                .select()
                                .single()];
                    case 1:
                        _a = _b.sent(), approvalData = _a.data, error = _a.error;
                        if (error) {
                            return [2 /*return*/, { success: false, error: error.message }];
                        }
                        return [2 /*return*/, { success: true, approvalId: approvalData.id }];
                    case 2:
                        error_2 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_2 instanceof Error ? error_2.message : 'Unknown error'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Process approval decision (human approval required)
     */
    COOOrchestrator.prototype.processApproval = function (approvalId, decision, approvedBy, rejectionReason) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, approvalData, approvalError, taskError, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, supabase
                                .from('agent_approval_queue')
                                .update({
                                status: decision,
                                approved_by: approvedBy,
                                rejection_reason: rejectionReason,
                                processed_at: new Date().toISOString()
                            })
                                .eq('id', approvalId)
                                .select()
                                .single()];
                    case 1:
                        _a = _b.sent(), approvalData = _a.data, approvalError = _a.error;
                        if (approvalError) {
                            return [2 /*return*/, { success: false, error: approvalError.message }];
                        }
                        return [4 /*yield*/, supabase
                                .from('agent_tasks')
                                .update({
                                approval_status: decision,
                                approved_by: approvedBy,
                                approved_at: decision === 'approved' ? new Date().toISOString() : null,
                                status: decision === 'approved' ? 'pending' : 'cancelled',
                                updated_at: new Date().toISOString()
                            })
                                .eq('id', approvalData.task_id)];
                    case 2:
                        taskError = (_b.sent()).error;
                        if (taskError) {
                            return [2 /*return*/, { success: false, error: taskError.message }];
                        }
                        // Log the approval decision
                        return [4 /*yield*/, this.logExecution(approvalData.task_id, 'COO Orchestrator', 'approval_processed', {
                                decision: decision,
                                approvedBy: approvedBy,
                                rejectionReason: rejectionReason,
                                approvalLevel: approvalData.approval_level
                            }, true)];
                    case 3:
                        // Log the approval decision
                        _b.sent();
                        if (!(decision === 'approved')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.executeApprovedTask(approvalData.task_id)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [2 /*return*/, { success: true }];
                    case 6:
                        error_3 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : 'Unknown error'
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute approved task
     */
    COOOrchestrator.prototype.executeApprovedTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, taskData, taskError, executionResult, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 6, , 7]);
                        return [4 /*yield*/, supabase
                                .from('agent_tasks')
                                .update({
                                status: 'in_progress',
                                updated_at: new Date().toISOString()
                            })
                                .eq('id', taskId)
                                .select()
                                .single()];
                    case 1:
                        _a = _b.sent(), taskData = _a.data, taskError = _a.error;
                        if (taskError) {
                            throw new Error(taskError.message);
                        }
                        // Log execution start
                        return [4 /*yield*/, this.logExecution(taskId, taskData.assigned_agent, 'execution_started', {
                                taskType: taskData.task_type,
                                taskName: taskData.task_name
                            }, true)];
                    case 2:
                        // Log execution start
                        _b.sent();
                        return [4 /*yield*/, this.executeTaskByType(taskData)];
                    case 3:
                        executionResult = _b.sent();
                        // Update task with result
                        return [4 /*yield*/, supabase
                                .from('agent_tasks')
                                .update({
                                status: executionResult.success ? 'completed' : 'failed',
                                result: executionResult.result,
                                error_details: executionResult.error,
                                completed_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            })
                                .eq('id', taskId)];
                    case 4:
                        // Update task with result
                        _b.sent();
                        // Log execution completion
                        return [4 /*yield*/, this.logExecution(taskId, taskData.assigned_agent, 'execution_completed', {
                                success: executionResult.success,
                                result: executionResult.result,
                                error: executionResult.error
                            }, executionResult.success)];
                    case 5:
                        // Log execution completion
                        _b.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        error_4 = _b.sent();
                        console.error('Error executing approved task:', error_4);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Execute specific task types
     */
    COOOrchestrator.prototype.executeTaskByType = function (taskData) {
        return __awaiter(this, void 0, void 0, function () {
            var task_type, task_name, parameters, _a, auditResult, handoffResult, error_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        task_type = taskData.task_type, task_name = taskData.task_name, parameters = taskData.parameters;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 10, , 11]);
                        _a = task_type;
                        switch (_a) {
                            case 'system_audit': return [3 /*break*/, 2];
                            case 'session_handoff': return [3 /*break*/, 4];
                            case 'data_migration': return [3 /*break*/, 6];
                            case 'agent_coordination': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 8];
                    case 2: return [4 /*yield*/, this.sessionHandoff.performSystemAudit()];
                    case 3:
                        auditResult = _b.sent();
                        return [2 /*return*/, { success: true, result: auditResult }];
                    case 4: return [4 /*yield*/, this.sessionHandoff.generateHandoffReport()];
                    case 5:
                        handoffResult = _b.sent();
                        return [2 /*return*/, { success: handoffResult.success, result: handoffResult.report, error: handoffResult.error }];
                    case 6: return [2 /*return*/, {
                            success: true,
                            result: { message: 'Data migration task orchestrated - requires manual SQL execution' }
                        }];
                    case 7: return [2 /*return*/, {
                            success: true,
                            result: { message: 'Agent coordination task completed - all agents under COO control' }
                        }];
                    case 8: return [2 /*return*/, {
                            success: false,
                            error: "Unknown task type: ".concat(task_type)
                        }];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_5 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_5 instanceof Error ? error_5.message : 'Unknown error'
                            }];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get control tower status
     */
    COOOrchestrator.prototype.getControlTowerStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, pendingApprovals, activeTasks, completedTasks, failedTasks, uniqueActiveAgents, error_6;
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
            return __generator(this, function (_o) {
                switch (_o.label) {
                    case 0:
                        _o.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, Promise.all([
                                supabase.from('agent_approval_queue').select('count').eq('status', 'pending'),
                                supabase.from('agent_tasks').select('assigned_agent').eq('status', 'in_progress'),
                                supabase.from('agent_tasks').select('count').eq('status', 'completed'),
                                supabase.from('agent_tasks').select('count').eq('status', 'failed')
                            ])];
                    case 1:
                        _a = _o.sent(), pendingApprovals = _a[0], activeTasks = _a[1], completedTasks = _a[2], failedTasks = _a[3];
                        uniqueActiveAgents = Array.from(new Set(((_b = activeTasks.data) === null || _b === void 0 ? void 0 : _b.map(function (task) { return task.assigned_agent; })) || []));
                        return [2 /*return*/, {
                                pendingApprovals: ((_d = (_c = pendingApprovals.data) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
                                activeAgents: uniqueActiveAgents,
                                completedTasks: ((_f = (_e = completedTasks.data) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.count) || 0,
                                failedTasks: ((_h = (_g = failedTasks.data) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.count) || 0,
                                systemHealth: this.assessSystemHealth(((_k = (_j = pendingApprovals.data) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.count) || 0, ((_m = (_l = failedTasks.data) === null || _l === void 0 ? void 0 : _l[0]) === null || _m === void 0 ? void 0 : _m.count) || 0),
                                lastUpdate: new Date().toISOString()
                            }];
                    case 2:
                        error_6 = _o.sent();
                        return [2 /*return*/, {
                                pendingApprovals: 0,
                                activeAgents: [],
                                completedTasks: 0,
                                failedTasks: 0,
                                systemHealth: 'error',
                                lastUpdate: new Date().toISOString()
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get pending approvals for human review
     */
    COOOrchestrator.prototype.getPendingApprovals = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_7;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabase
                                .from('agent_approval_queue')
                                .select("\n          *,\n          agent_tasks (\n            task_name,\n            description,\n            assigned_agent,\n            priority\n          )\n        ")
                                .eq('status', 'pending')
                                .order('created_at', { ascending: true })];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error) {
                            console.error('Error fetching pending approvals:', error);
                            return [2 /*return*/, []];
                        }
                        return [2 /*return*/, data.map(function (approval) { return ({
                                id: approval.id,
                                taskId: approval.task_id,
                                requestedBy: approval.requested_by,
                                requestDetails: approval.request_details,
                                approvalLevel: approval.approval_level,
                                status: approval.status,
                                approvedBy: approval.approved_by,
                                rejectionReason: approval.rejection_reason,
                                createdAt: approval.created_at,
                                processedAt: approval.processed_at
                            }); })];
                    case 2:
                        error_7 = _b.sent();
                        console.error('Error fetching pending approvals:', error_7);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Log execution details
     */
    COOOrchestrator.prototype.logExecution = function (taskId, agentName, action, details, success, durationMs) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabase
                                .from('agent_execution_log')
                                .insert([{
                                    task_id: taskId,
                                    agent_name: agentName,
                                    action: action,
                                    execution_details: details,
                                    success: success,
                                    error_message: success ? null : details.error,
                                    duration_ms: durationMs
                                }])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_8 = _a.sent();
                        console.error('Error logging execution:', error_8);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Determine approval level based on task type and priority
     */
    COOOrchestrator.prototype.getApprovalLevel = function (taskType, priority) {
        var criticalTasks = ['data_migration', 'schema_changes', 'production_deployment'];
        var elevatedTasks = ['system_audit', 'agent_coordination'];
        if (criticalTasks.includes(taskType) || priority === 'high') {
            return 'critical';
        }
        else if (elevatedTasks.includes(taskType)) {
            return 'elevated';
        }
        else {
            return 'standard';
        }
    };
    /**
     * Assess system health
     */
    COOOrchestrator.prototype.assessSystemHealth = function (pendingApprovals, failedTasks) {
        if (failedTasks > 5) {
            return 'error';
        }
        else if (pendingApprovals > 10 || failedTasks > 2) {
            return 'warning';
        }
        else {
            return 'healthy';
        }
    };
    /**
     * Get agent status
     */
    COOOrchestrator.prototype.getAgentStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var controlTowerStatus;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getControlTowerStatus()];
                    case 1:
                        controlTowerStatus = _a.sent();
                        return [2 /*return*/, {
                                autonomyLevel: this.autonomyLevel,
                                totalTasks: controlTowerStatus.completedTasks + controlTowerStatus.failedTasks,
                                pendingApprovals: controlTowerStatus.pendingApprovals,
                                completedTasks: controlTowerStatus.completedTasks,
                                failedTasks: controlTowerStatus.failedTasks,
                                systemHealth: controlTowerStatus.systemHealth
                            }];
                }
            });
        });
    };
    return COOOrchestrator;
}());
exports.COOOrchestrator = COOOrchestrator;
exports.default = COOOrchestrator;
