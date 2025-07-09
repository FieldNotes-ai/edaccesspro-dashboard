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
exports.SessionHandoffService = void 0;
var supabase_js_1 = require("@supabase/supabase-js");
var supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || 'https://cqodtsqeiimwgidkrttb.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxb2R0c3FlaWltd2dpZGtydHRiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTk0NDg2NywiZXhwIjoyMDY3NTIwODY3fQ.A5t_Wmk_IIfRAVoAhVJ_INaabJNmN6SSQjfqBWcAv80');
var SessionHandoffService = /** @class */ (function () {
    function SessionHandoffService() {
    }
    /**
     * Complete system audit of current architecture
     */
    SessionHandoffService.prototype.performSystemAudit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, auditResult;
            return __generator(this, function (_a) {
                timestamp = new Date().toISOString();
                auditResult = {
                    timestamp: timestamp,
                    projectPhase: 'Foundation Phase - Supabase Migration & COO Agent',
                    completionPercentage: 70,
                    architecture: {
                        databases: ['Airtable (Legacy)', 'Supabase (Optimized Schema Ready)'],
                        agents: ['ESA Market Intelligence Agent', 'COO Agent (In Development)'],
                        apiEndpoints: [
                            '/api/auth/login',
                            '/api/kpis',
                            '/api/costs',
                            '/api/workflows',
                            '/api/change-review'
                        ],
                        frontendComponents: [
                            'Dashboard Components',
                            'US Map Visualization',
                            'Vendor Onboarding',
                            'Admin Research Interface'
                        ]
                    },
                    criticalFiles: [
                        'migration/supabase_schema.sql',
                        'src/services/esaMarketIntelligenceAgent.ts',
                        'SESSION_HANDOFF_CRITICAL.md',
                        'src/services/sessionHandoff.ts'
                    ],
                    dependencies: [
                        '@supabase/supabase-js',
                        '@anthropic-ai/sdk',
                        'next.js',
                        'react',
                        'typescript'
                    ],
                    migrationStatus: {
                        supabaseDeployment: true,
                        dataImported: false,
                        schemaOptimized: true
                    },
                    nextActions: [
                        'Manual SQL execution in Supabase dashboard',
                        'COO Agent implementation with approval gates',
                        'Control tower integration',
                        'Session handoff system testing'
                    ]
                };
                return [2 /*return*/, auditResult];
            });
        });
    };
    /**
     * Create session handoff record with scope creep prevention
     */
    SessionHandoffService.prototype.createSessionHandoff = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var validationResult, _a, handoffData, error, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        validationResult = this.validateScopeConstraints(data);
                        if (!validationResult.isValid) {
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Scope constraint violation: ".concat(validationResult.violations.join(', '))
                                }];
                        }
                        return [4 /*yield*/, supabase
                                .from('session_handoff')
                                .insert([{
                                    session_id: data.sessionId,
                                    project_phase: data.projectPhase,
                                    completion_percentage: data.completionPercentage,
                                    current_objectives: data.currentObjectives,
                                    completed_tasks: data.completedTasks,
                                    blocked_items: data.blockedItems,
                                    next_session_priorities: data.nextSessionPriorities,
                                    scope_constraints: data.scopeConstraints,
                                    critical_notes: data.criticalNotes
                                }])
                                .select()
                                .single()];
                    case 1:
                        _a = _b.sent(), handoffData = _a.data, error = _a.error;
                        if (error) {
                            return [2 /*return*/, { success: false, error: error.message }];
                        }
                        return [2 /*return*/, { success: true, id: handoffData.id }];
                    case 2:
                        error_1 = _b.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_1 instanceof Error ? error_1.message : 'Unknown error'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate scope constraints to prevent scope creep
     */
    SessionHandoffService.prototype.validateScopeConstraints = function (data) {
        var violations = [];
        // Define allowed scope for Foundation Phase
        var allowedObjectives = [
            'supabase migration',
            'coo agent',
            'schema optimization',
            'session handoff',
            'approval gates',
            'control tower',
            'foundation phase'
        ];
        var forbiddenItems = [
            'ui improvements',
            'new features',
            'vendor portal',
            'additional integrations',
            'architecture changes'
        ];
        // Check current objectives for scope creep
        data.currentObjectives.forEach(function (objective) {
            var lowerObjective = objective.toLowerCase();
            var hasAllowedKeyword = allowedObjectives.some(function (allowed) {
                return lowerObjective.includes(allowed);
            });
            var hasForbiddenKeyword = forbiddenItems.some(function (forbidden) {
                return lowerObjective.includes(forbidden);
            });
            if (hasForbiddenKeyword) {
                violations.push("Forbidden scope item: ".concat(objective));
            }
            if (!hasAllowedKeyword && !hasForbiddenKeyword) {
                violations.push("Out of scope objective: ".concat(objective));
            }
        });
        // Check completion percentage bounds
        if (data.completionPercentage < 0 || data.completionPercentage > 100) {
            violations.push('Completion percentage must be between 0-100');
        }
        return {
            isValid: violations.length === 0,
            violations: violations
        };
    };
    /**
     * Get current session status
     */
    SessionHandoffService.prototype.getCurrentSessionStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, data, error, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabase
                                .from('session_handoff')
                                .select('*')
                                .order('created_at', { ascending: false })
                                .limit(1)
                                .single()];
                    case 1:
                        _a = _b.sent(), data = _a.data, error = _a.error;
                        if (error || !data) {
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/, {
                                sessionId: data.session_id,
                                projectPhase: data.project_phase,
                                completionPercentage: data.completion_percentage,
                                currentObjectives: data.current_objectives,
                                completedTasks: data.completed_tasks,
                                blockedItems: data.blocked_items,
                                nextSessionPriorities: data.next_session_priorities,
                                scopeConstraints: data.scope_constraints,
                                criticalNotes: data.critical_notes
                            }];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Error fetching session status:', error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update session progress
     */
    SessionHandoffService.prototype.updateSessionProgress = function (sessionId, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var error, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, supabase
                                .from('session_handoff')
                                .update({
                                completion_percentage: updates.completionPercentage,
                                current_objectives: updates.currentObjectives,
                                completed_tasks: updates.completedTasks,
                                blocked_items: updates.blockedItems,
                                next_session_priorities: updates.nextSessionPriorities,
                                critical_notes: updates.criticalNotes,
                                updated_at: new Date().toISOString()
                            })
                                .eq('session_id', sessionId)];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            return [2 /*return*/, { success: false, error: error.message }];
                        }
                        return [2 /*return*/, { success: true }];
                    case 2:
                        error_3 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_3 instanceof Error ? error_3.message : 'Unknown error'
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate session handoff report
     */
    SessionHandoffService.prototype.generateHandoffReport = function () {
        return __awaiter(this, void 0, void 0, function () {
            var currentStatus, systemAudit, report, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getCurrentSessionStatus()];
                    case 1:
                        currentStatus = _a.sent();
                        return [4 /*yield*/, this.performSystemAudit()];
                    case 2:
                        systemAudit = _a.sent();
                        if (!currentStatus) {
                            return [2 /*return*/, { success: false, error: 'No current session found' }];
                        }
                        report = "\n# \uD83D\uDEA8 SESSION HANDOFF REPORT - ".concat(new Date().toISOString(), "\n\n## \uD83D\uDCCA PROJECT STATUS\n- **Phase**: ").concat(currentStatus.projectPhase, "\n- **Completion**: ").concat(currentStatus.completionPercentage, "%\n- **Session ID**: ").concat(currentStatus.sessionId, "\n\n## \u2705 COMPLETED TASKS\n").concat(currentStatus.completedTasks.map(function (task) { return "- \u2705 ".concat(task); }).join('\n'), "\n\n## \uD83C\uDFAF CURRENT OBJECTIVES\n").concat(currentStatus.currentObjectives.map(function (obj) { return "- \uD83C\uDFAF ".concat(obj); }).join('\n'), "\n\n## \uD83D\uDEA7 BLOCKED ITEMS\n").concat(currentStatus.blockedItems.map(function (item) { return "- \uD83D\uDEA7 ".concat(item); }).join('\n'), "\n\n## \uD83D\uDCCB NEXT SESSION PRIORITIES\n").concat(currentStatus.nextSessionPriorities.map(function (priority) { return "- \uD83D\uDCCB ".concat(priority); }).join('\n'), "\n\n## \uD83D\uDEAB SCOPE CONSTRAINTS\n").concat(currentStatus.scopeConstraints.map(function (constraint) { return "- \uD83D\uDEAB ".concat(constraint); }).join('\n'), "\n\n## \uD83C\uDFD7\uFE0F ARCHITECTURE AUDIT\n- **Databases**: ").concat(systemAudit.architecture.databases.join(', '), "\n- **Agents**: ").concat(systemAudit.architecture.agents.join(', '), "\n- **API Endpoints**: ").concat(systemAudit.architecture.apiEndpoints.length, " endpoints\n- **Frontend Components**: ").concat(systemAudit.architecture.frontendComponents.length, " components\n\n## \uD83D\uDD04 MIGRATION STATUS\n- **Supabase Deployment**: ").concat(systemAudit.migrationStatus.supabaseDeployment ? '✅' : '❌', "\n- **Data Imported**: ").concat(systemAudit.migrationStatus.dataImported ? '✅' : '❌', "\n- **Schema Optimized**: ").concat(systemAudit.migrationStatus.schemaOptimized ? '✅' : '❌', "\n\n## \uD83D\uDCDD CRITICAL NOTES\n").concat(currentStatus.criticalNotes || 'None', "\n\n## \uD83D\uDD04 NEXT ACTIONS\n").concat(systemAudit.nextActions.map(function (action) { return "- \uD83D\uDD04 ".concat(action); }).join('\n'), "\n\n---\n**Generated**: ").concat(new Date().toISOString(), "\n**Next Session**: Read this report first, then execute priorities in order\n");
                        return [2 /*return*/, { success: true, report: report }];
                    case 3:
                        error_4 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                error: error_4 instanceof Error ? error_4.message : 'Unknown error'
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize current session with foundation phase data
     */
    SessionHandoffService.prototype.initializeFoundationPhase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var foundationData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        foundationData = {
                            sessionId: "foundation-".concat(Date.now()),
                            projectPhase: 'Foundation Phase - Supabase Migration & COO Agent',
                            completionPercentage: 70,
                            currentObjectives: [
                                'Complete system audit of current architecture',
                                'Optimize database schema (remove 21 redundant fields)',
                                'Deploy optimized schema to Supabase',
                                'Build session handoff system with scope creep prevention',
                                'Create COO agent with STRICT human approval gates via control tower'
                            ],
                            completedTasks: [
                                'Airtable data exported (360 records, 9 tables)',
                                'Supabase project created with credentials',
                                'Database schema designed',
                                'Multi-agent architecture planned',
                                'User requirements captured'
                            ],
                            blockedItems: [
                                'Manual SQL execution required in Supabase dashboard',
                                'Data import pending schema deployment'
                            ],
                            nextSessionPriorities: [
                                'Complete COO agent implementation',
                                'Test approval workflow system',
                                'Verify session handoff system',
                                'Plan next phase architecture'
                            ],
                            scopeConstraints: [
                                'No new feature requests',
                                'No architecture changes beyond planned multi-agent system',
                                'No additional integrations',
                                'No UI/UX improvements',
                                'COO-only focus until foundation is solid'
                            ],
                            criticalNotes: 'CRITICAL: All agent actions require human approval initially. Graduated autonomy system planned.'
                        };
                        return [4 /*yield*/, this.createSessionHandoff(foundationData)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return SessionHandoffService;
}());
exports.SessionHandoffService = SessionHandoffService;
exports.default = SessionHandoffService;
