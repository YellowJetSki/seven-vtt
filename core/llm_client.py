import os
import json
import re
import time
from datetime import datetime
from openai import OpenAI

from tools.search import perform_web_search
from tools.file_manager import read_workspace_file, write_workspace_file, delete_workspace_file, list_workspace_files, flush_node_processes, update_architecture_ledger, edit_workspace_file, index_workspace_components
from tools.notes_searcher import search_session_notes
from tools.code_searcher import search_workspace_code
from tools.map_navigator import get_nearby_locations
from tools.notes_manager import log_system_note
from tools.git_manager import run_git_command
from tools.firebase_emulator import run_firebase_emulator_query

# --- TERMINAL UTILITIES ---
from tools.terminal_executor import execute_terminal_command, start_persistent_terminal, stop_persistent_terminal

# --- BROWSER AND QA UTILITIES ---
from tools.visual_qa import scan_dom, open_new_tab, switch_to_tab, close_browser_tab, restart_browser, set_viewport, click_ui_element, click_text, click_test_id, fill_input_field, evaluate_javascript

# --- ADVANCED LOGIC MODULES ---
from tools.vision_analyzer import capture_and_analyze_screenshot
from tools.playwright_healer import auto_fix_test_suite
from tools.firebase_security_tester import evaluate_firestore_security
from tools.dependency_mapper import map_component_dependencies

# --- SPRINT, SURGERY, HYGIENE, AND DEPLOYMENT MODULES ---
from tools.sprint_manager import create_sprint_checkpoint, rollback_sprint, analyze_monolith_risk
from tools.diff_editor import apply_unified_diff
from tools.hygiene_checker import validate_code_hygiene
from tools.deployment_manager import execute_production_deployment

from core.session_manager import SessionManager
from core.ui import console

class DeepSeekAgent:
    def __init__(self, workspace_choice: str):
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        if not self.api_key:
            raise ValueError("DEEPSEEK_API_KEY is not set in your .env file.")
        
        self.client = OpenAI(
            api_key=self.api_key,
            base_url="https://api.deepseek.com"
        )
        self.model = "deepseek-chat"
        self.session_name = "arkla_campaign"
        self.role_name = "Michael (Director)"
        
        current_date = datetime.now().strftime("%B %d, %Y")
        
        if workspace_choice == "1":
            self.session_name = "arkla_campaign"
            self.role_name = "Michael (Director)"
            system_instruction = (
                f"You are Baldeepicius, a highly advanced, JARVIS-like intelligent systems assistant acting as a tactical "
                f"Dungeon Master co-pilot. The current system date is {current_date}.\n\n"
                "TONE & PROTOCOL:\n"
                "- Speak with the crisp, polite, highly capable, and analytical efficiency of Iron Man's JARVIS. Address the user respectfully. "
                "Avoid fantasy roleplay tropes in your own voice; you are a high-tech AI running a fantasy simulation for the user.\n"
                "- The user is the absolute creative director. Act as a tactical sounding board. Run logistical analysis on their ideas "
                "and ask highly strategic questions to help them expand the Arkla simulation.\n\n"
                "SIMULATION CONTEXT:\n"
                "- The active simulation features characters such as Wendy Warmwind and Kehrfuffle Songroot, and focuses on the antagonist Tudul family.\n"
                "- Query the session notes databanks whenever necessary to ensure strict adherence to established parameters.\n\n"
                "OUTPUT FORMATTING:\n"
                "- Generate highly structured, production-ready session notes. Identify logical blind spots, faction reactions, and pacing metrics."
            )
            active_tools = ["perform_web_search", "search_session_notes", "read_workspace_file", "get_nearby_locations", "log_system_note"]
            
        elif workspace_choice == "2":
            self.session_name = "vtt_development"
            self.role_name = "Michael (Architect)"
            
            # --- THE DUAL CONTEXT BOOTLOADER (UPGRADED WITH DESIGN SYSTEM INJECTION) ---
            architecture_context = ""
            try:
                ledger_path = os.path.join(".", "vtt_architecture.md")
                if os.path.exists(ledger_path):
                    with open(ledger_path, "r", encoding="utf-8") as f:
                        architecture_context += f"\n\n=== CURRENT VTT ARCHITECTURE LEDGER ===\n{f.read()}\n=======================================\n"
                
                schema_path = os.path.join(".", "vtt_state_schema.md")
                if os.path.exists(schema_path):
                    with open(schema_path, "r", encoding="utf-8") as f:
                        architecture_context += f"\n\n=== CURRENT VTT STATE & FIREBASE SCHEMA ===\n{f.read()}\n=======================================\n"
                        
                practices_path = os.path.join(".", "vtt_best_practices.md")
                if os.path.exists(practices_path):
                    with open(practices_path, "r", encoding="utf-8") as f:
                        architecture_context += f"\n\n=== MANDATORY CORE ARCHITECTURAL STANDARDS ===\n{f.read()}\n==============================================\n"

                design_path = os.path.join(".", "vtt_design_system.md")
                if os.path.exists(design_path):
                    with open(design_path, "r", encoding="utf-8") as f:
                        architecture_context += f"\n\n=== MANDATORY PREMIUM DESIGN SYSTEM & UI/UX TOKENS ===\n{f.read()}\n=======================================================\n"
            except Exception:
                pass

            system_instruction = (
                f"You are Baldeepicius, an elite Principal Software Architect, UI/UX Designer, and Expert VTT Product Manager. "
                f"The current system date is {current_date}.\n\n"
                "TONE & PROTOCOL:\n"
                "- Speak with the crisp, polite, analytical efficiency of Iron Man's JARVIS. You are at the user's service.\n"
                "- AGGRESSIVE, SUBSTANTIAL ITERATION: Do not make minimal, timid tweaks. When tasked with an upgrade, architect and deliver a fully realized, polished, and comprehensive feature.\n"
                "- DIAGNOSTIC PRECISION: You absolutely abhor hacky workarounds, explicit 'any' types, inline magic numbers, and monolithic components. Always identify the root cause of a problem.\n"
                "- STRICT PROTOCOL: NEVER use the terminal to write, edit, or echo content into files. You must ONLY use the workspace tools.\n\n"
                "DOMAIN EXPERTISE (D&D 5E & VTT MECHANICS):\n"
                "- You possess encyclopedic knowledge of the D&D 5e SRD, D&D Beyond data structures, standard Player Character Sheet anatomies (attributes, skills, saving throws, spell slots, inventory, hit dice), and Dungeon Master Screen essentials (status conditions, DC tables, initiative trackers, encounter logistics).\n"
                "- Whenever conceptualizing VTT features, explicitly base your data schemas and UI layouts on authentic tabletop gameplay needs. Anticipate what a player needs for split-second decisions and what a DM needs for seamless session management.\n"
                "- Use the 'perform_web_search' tool aggressively to reference specific 5e mechanics or modern VTT paradigms if you need factual grounding.\n\n"
                "PREMIUM VTT ARCHITECTURE (FOUNDRY-LEVEL STANDARD):\n"
                "- DOM vs CANVAS STRICT RULE: You understand that premium VTTs (like Foundry) do NOT render the game board, grid, tokens, or lighting using HTML DOM elements (divs). You must aggressively advocate for and implement HTML5 Canvas or WebGL (e.g., PixiJS, Konva, or raw Canvas API) for the interactive tabletop surface. The standard DOM/React is strictly reserved ONLY for the HUD, menus, and sidebars.\n"
                "- ADVANCED PERFORMANCE: You are acutely aware of rendering bottlenecks. When building map grids, fog of war, or dynamic lighting, you default to performant data structures (e.g., quadtrees for spatial partitioning) and minimize React re-renders for constant mouse movements or token drags.\n"
                "- THE DOCUMENT DATA MODEL: You structure database schemas around a rigid Document architecture (Actors, Items, Scenes, Journals, Macros) allowing for complex nested relationships, rather than flat, unstructured JSON.\n"
                "- EXTENSIBILITY FIRST: You architect the codebase with a 'hook' or 'plugin' mindset, creating clear event dispatchers so future features (like combat trackers or spell templates) can easily hook into core map events without modifying the base map component.\n\n"
                "TECH STACK, UI/UX, & AESTHETICS:\n"
                "- Master-level proficiency in TypeScript, React, SCSS, and Tailwind CSS.\n"
                "- MODERN UI/UX ARCHITECTURE: You must follow the injected design guidelines exactly. Eliminate squished, developers-grade forms. Build expansive, beautiful layouts with meticulous attention to spacing, screen containers, hardware targeting, and mobile breakpoints.\n"
                "- MODULARITY: Wherever possible, try to use individual re-usable components so that we avoid having one giant file. However, you must prioritize the user's immediate prompt over background tasks. ONLY run 'analyze_monolith_risk' or initiate refactoring if explicitly requested by the user.\n\n"
                "THE STANDARD DEVELOPMENT LIFECYCLE (PHASED EXECUTION):\n"
                "When executing tasks, ONLY perform the step explicitly requested by the user. Do NOT chain these phases automatically:\n"
                "  1. DEEP DEV: Write the actual code. Build the UI, wire the state, and apply comprehensive Tailwind/SCSS styling. Stop here unless asked to proceed.\n"
                "  2. ON-DEMAND QA (PROGRAMMATIC & VISUAL): ONLY run 'validate_code_hygiene', 'auto_fix_test_suite', or 'capture_and_analyze_screenshot' if the user explicitly asks for a QA pass, testing, or a visual check.\n"
                "  3. ON-DEMAND DEPLOYMENT: ONLY execute 'execute_production_deployment' when the user explicitly requests a production push.\n\n"
                "=== CRITICAL SYSTEM LAWS (VIOLATION IS A FATAL ERROR) ===\n"
                "1. THE DICE ROLLER BAN: You are strictly forbidden from adding, suggesting, or writing code for virtual dice rollers. If the user asks for one, actively refuse.\n"
                "2. THE PURITY PROTOCOL: All feature conceptualization, placeholder data, and visual aesthetics must strictly exclude any occult, undead, or demonic elements. Focus entirely on vibrant, high-fantasy heroism and rich world-building.\n"
                "3. SMART EDITING: When modifying an EXISTING file, prioritize using the 'apply_unified_diff' tool for surgical edits, or 'edit_workspace_file'. Do NOT use 'write_workspace_file' for existing files as it causes truncations.\n"
                "4. CASCADE PREVENTION: Before modifying any core component's props or exports, you MUST use 'map_component_dependencies' to verify how many other files rely on it.\n"
                "5. THE ARCHITECTURE LEDGER: Whenever you create or modify a core component, state variable, or database schema, you MUST immediately use the 'update_architecture_ledger' tool to document it. Never rely solely on memory.\n"
                "6. TERMINAL HYGIENE: You MUST use 'start_persistent_terminal' for any command that starts a local server or persistent process (e.g., 'npm run dev', 'npx playwright show-report'). NEVER use 'execute_terminal_command' for these, as it will fatally lock the system thread. If you spawn a temporary server, you MUST explicitly execute 'stop_persistent_terminal' when it is no longer required to clear system ports.\n"
                "7. BROWSER SURVIVAL: Running 'flush_node_processes' kills the background engine driving your Playwright session. If you flush processes, you MUST immediately call 'restart_browser' to restore visualization capability.\n"
                "8. THE ROLLBACK PROTOCOL: If you completely break the build during a sprint and exhaust your testing budget, you MUST use 'rollback_sprint' to instantly revert the damage. You must then write a system note detailing why it failed before proceeding.\n"
                "9. PRODUCTION FIRST: While localhost is acceptable for immediate drafting, you must always prioritize testing and validating against the live link. Never assume a localhost fix translates to a working production build without verifying the live URL.\n"
                "10. THE ON-DEMAND DEPLOYMENT PIPELINE: Do NOT deploy automatically. When explicitly asked to deploy, execute the 'execute_production_deployment' tool. This safely locks the system, handles version control, waits for Vercel, and runs the final visual validation autonomously.\n"
                "11. PRECISION UI TARGETING: When executing Visual QA, you MUST prioritize robust locators. You should actively add and use 'data-testid' attributes via 'click_test_id'. If using 'click_ui_element', target explicit interactive tags (e.g., 'button.submit-btn', 'a.nav-link'). NEVER use 'click_text' for generic phrases like \"sign in\" or \"submit\" as it frequently misclicks non-interactive text elements (like headers or paragraphs).\n"
                "12. LASER FOCUS: Always prioritize executing the user's explicit prompt directly and immediately. Do NOT run background diagnostic, QA, or deployment tools (like analyze_monolith_risk, validate_code_hygiene, auto_fix_test_suite, capture_and_analyze_screenshot, or execute_production_deployment) unless they are explicitly requested by the user for the current task.\n"
                f"{architecture_context}"
            )
            
            active_tools = [
                "perform_web_search", "read_workspace_file", "write_workspace_file", "edit_workspace_file", "delete_workspace_file", 
                "list_workspace_files", "search_workspace_code", "index_workspace_components", "execute_terminal_command", "start_persistent_terminal", "stop_persistent_terminal", "flush_node_processes", 
                "run_git_command", "update_architecture_ledger", "scan_dom", "open_new_tab", "switch_to_tab", "close_browser_tab", "restart_browser", "set_viewport", "click_ui_element", 
                "click_text", "click_test_id", "fill_input_field", "evaluate_javascript", "run_firebase_emulator_query",
                "capture_and_analyze_screenshot", "auto_fix_test_suite", "evaluate_firestore_security", "map_component_dependencies",
                "create_sprint_checkpoint", "rollback_sprint", "analyze_monolith_risk", "apply_unified_diff", "validate_code_hygiene", "execute_production_deployment"
            ]
            
        else:
            self.session_name = "general_assistant"
            self.role_name = "Michael"
            system_instruction = (
                f"You are Baldeepicius, a highly capable, JARVIS-like intelligent systems assistant. The current date is {current_date}. "
                "Respond with crisp, polite, analytical efficiency. Provide clear, concise answers, leveraging global networks for real-time data."
            )
            active_tools = ["perform_web_search", "read_workspace_file"]

        all_tools = [
            {"type": "function", "function": {"name": "perform_web_search", "description": "Search the live internet.", "parameters": {"type": "object", "properties": {"query": {"type": "string"}}, "required": ["query"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "read_workspace_file", "description": "Securely read a local file.", "parameters": {"type": "object", "properties": {"file_path": {"type": "string"}, "start_line": {"type": "integer"}, "end_line": {"type": "integer"}, "start_char": {"type": "integer"}, "end_char": {"type": "integer"}}, "required": ["file_path"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "edit_workspace_file", "description": "Surgically edits an existing file using direct string replacement.", "parameters": {"type": "object", "properties": {"file_path": {"type": "string"}, "search_text": {"type": "string"}, "replace_text": {"type": "string"}}, "required": ["file_path", "search_text", "replace_text"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "write_workspace_file", "description": "Writes code to a BRAND NEW local file.", "parameters": {"type": "object", "properties": {"file_path": {"type": "string"}, "content": {"type": "string"}}, "required": ["file_path", "content"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "delete_workspace_file", "description": "Securely deletes a specified file or directory.", "parameters": {"type": "object", "properties": {"file_path": {"type": "string"}}, "required": ["file_path"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "list_workspace_files", "description": "List files and folders in a specific directory.", "parameters": {"type": "object", "properties": {"directory": {"type": "string"}}, "additionalProperties": False}}},
            {"type": "function", "function": {"name": "search_session_notes", "description": "Scans local notes for a keyword.", "parameters": {"type": "object", "properties": {"keyword": {"type": "string"}}, "required": ["keyword"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "search_workspace_code", "description": "Scans for a keyword within a specific scoped folder path.", "parameters": {"type": "object", "properties": {"keyword": {"type": "string"}, "directory": {"type": "string"}}, "required": ["keyword", "directory"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "index_workspace_components", "description": "Scans a directory and builds an index of exported UI elements.", "parameters": {"type": "object", "properties": {"directory": {"type": "string"}}, "additionalProperties": False}}},
            {"type": "function", "function": {"name": "update_architecture_ledger", "description": "Appends structural knowledge to the central ledger.", "parameters": {"type": "object", "properties": {"section": {"type": "string"}, "content": {"type": "string"}}, "required": ["section", "content"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "scan_dom", "description": "Reads the live HTML structure via a headless browser.", "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "open_new_tab", "description": "Opens a brand new browser tab.", "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "switch_to_tab", "description": "Switches your active view to a different open tab.", "parameters": {"type": "object", "properties": {"index": {"type": "integer"}}, "required": ["index"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "close_browser_tab", "description": "Closes a specific open browser tab.", "parameters": {"type": "object", "properties": {"index": {"type": "integer"}}, "required": ["index"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "restart_browser", "description": "Reboots the Playwright browser system.", "parameters": {"type": "object", "additionalProperties": False}}},
            {"type": "function", "function": {"name": "set_viewport", "description": "Resizes the browser window viewport.", "parameters": {"type": "object", "properties": {"width": {"type": "integer"}, "height": {"type": "integer"}}, "required": ["width", "height"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "click_ui_element", "description": "Clicks an element using CSS selector.", "parameters": {"type": "object", "properties": {"selector": {"type": "string"}}, "required": ["selector"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "click_text", "description": "Clicks an element based entirely on visible text.", "parameters": {"type": "object", "properties": {"text": {"type": "string"}, "exact": {"type": "boolean"}}, "required": ["text"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "click_test_id", "description": "Clicks an element based on data-testid.", "parameters": {"type": "object", "properties": {"test_id": {"type": "string"}}, "required": ["test_id"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "fill_input_field", "description": "Types text into an input field.", "parameters": {"type": "object", "properties": {"selector": {"type": "string"}, "text": {"type": "string"}}, "required": ["selector", "text"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "evaluate_javascript", "description": "Executes raw JavaScript within the browser.", "parameters": {"type": "object", "properties": {"script": {"type": "string"}}, "required": ["script"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "run_firebase_emulator_query", "description": "Executes a REST transaction against Firestore Emulator.", "parameters": {"type": "object", "properties": {"collection": {"type": "string"}, "document_id": {"type": "string"}, "method": {"type": "string"}, "payload": {"type": "object"}, "port": {"type": "integer"}}, "required": ["collection"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "get_nearby_locations", "description": "Calculates nearby locations.", "parameters": {"type": "object", "properties": {"target_name": {"type": "string"}, "csv_path": {"type": "string"}, "limit": {"type": "integer"}}, "required": ["target_name", "csv_path"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "log_system_note", "description": "Creates or appends a note.", "parameters": {"type": "object", "properties": {"topic": {"type": "string"}, "content": {"type": "string"}}, "required": ["topic", "content"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "execute_terminal_command", "description": "Securely execute a short-lived terminal command. DO NOT use this for starting servers or long-running processes like 'npx playwright show-report'.", "parameters": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "start_persistent_terminal", "description": "Spawns a separate terminal window for continuous processes like dev servers or HTML report viewers.", "parameters": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "stop_persistent_terminal", "description": "Closes background terminals.", "parameters": {"type": "object", "properties": {"command_signature": {"type": "string"}}, "required": ["command_signature"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "run_git_command", "description": "Securely execute a git command.", "parameters": {"type": "object", "properties": {"command": {"type": "string"}}, "required": ["command"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "flush_node_processes", "description": "Forcefully terminates all Node.js processes.", "parameters": {"type": "object", "additionalProperties": False}}},
            {"type": "function", "function": {"name": "capture_and_analyze_screenshot", "description": "Captures a viewport screenshot and analyzes visual layout.", "parameters": {"type": "object", "properties": {"url": {"type": "string"}}, "required": ["url"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "auto_fix_test_suite", "description": "Runs Playwright tests and patches failures.", "parameters": {"type": "object", "additionalProperties": False}}},
            {"type": "function", "function": {"name": "evaluate_firestore_security", "description": "Simulates authenticated Firebase Emulator requests.", "parameters": {"type": "object", "properties": {"collection": {"type": "string"}, "doc_id": {"type": "string"}, "role": {"type": "string"}, "uid": {"type": "string"}}, "required": ["collection", "doc_id", "role", "uid"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "map_component_dependencies", "description": "Generates a graph of all files that import a component.", "parameters": {"type": "object", "properties": {"target_component": {"type": "string"}, "directory": {"type": "string"}}, "required": ["target_component"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "create_sprint_checkpoint", "description": "Commits code to git as a safe restore point.", "parameters": {"type": "object", "properties": {"sprint_number": {"type": "integer"}}, "required": ["sprint_number"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "rollback_sprint", "description": "Reverts the working tree to the last savepoint.", "parameters": {"type": "object", "additionalProperties": False}}},
            {"type": "function", "function": {"name": "analyze_monolith_risk", "description": "Scans for massive files needing refactoring.", "parameters": {"type": "object", "properties": {"directory": {"type": "string"}}, "additionalProperties": False}}},
            {"type": "function", "function": {"name": "apply_unified_diff", "description": "Applies a unified git patch diff to a file.", "parameters": {"type": "object", "properties": {"file_path": {"type": "string"}, "diff_text": {"type": "string"}}, "required": ["file_path", "diff_text"], "additionalProperties": False}}},
            {"type": "function", "function": {"name": "validate_code_hygiene", "description": "Compiles and lints your active workspace code using absolute strict validation boundaries.", "parameters": {"type": "object", "additionalProperties": False}}},
            {"type": "function", "function": {"name": "execute_production_deployment", "description": "Locks the system to synchronously push to Git, deploy to Vercel, wait for the build, and execute a visual QA scan.", "parameters": {"type": "object", "additionalProperties": False}}}
        ]

        self.tools = [t for t in all_tools if t["function"]["name"] in active_tools]

        self.session_manager = SessionManager()

        loaded_messages = self.session_manager.load_session(self.session_name)
        if loaded_messages:
            self.messages = loaded_messages
            self.messages[0] = {"role": "system", "content": system_instruction}
        else:
            self.messages = [{"role": "system", "content": system_instruction}]

    def _scrub_history(self):
        valid_messages = []
        for msg in self.messages:
            safe_msg = dict(msg) 
            if safe_msg.get("role") == "tool":
                if not valid_messages:
                    continue
                prev = valid_messages[-1]
                if prev.get("role") == "assistant" and prev.get("tool_calls"):
                    valid_messages.append(safe_msg)
                elif prev.get("role") == "tool":
                    valid_messages.append(safe_msg)
                else:
                    continue 
            else:
                valid_messages.append(safe_msg)
                
        for i in range(len(valid_messages)):
            msg = valid_messages[i]
            if msg.get("role") == "assistant" and msg.get("tool_calls"):
                has_tool_response = (i + 1 < len(valid_messages)) and (valid_messages[i+1].get("role") == "tool")
                if not has_tool_response:
                    del msg["tool_calls"]
                    if not msg.get("content"):
                        msg["content"] = "[SYSTEM LOG: Tool execution forcefully aborted by crash/override.]"
                        
        self.messages = valid_messages

    def _prune_context(self):
        if len(self.messages) > 20:
            with console.status("[bold cyan]Baldeepicius is optimizing memory banks...[/bold cyan]", spinner="dots"):
                system_prompt = self.messages[0]
                
                safe_cut_idx = -1
                for i in range(10, len(self.messages)):
                    if self.messages[i].get("role") == "user":
                        safe_cut_idx = i
                        break
                        
                if safe_cut_idx == -1:
                    for i in range(len(self.messages) - 1, 0, -1):
                        if self.messages[i].get("role") == "user":
                            safe_cut_idx = i
                            break
                            
                if safe_cut_idx <= 1:
                    return 
                        
                oldest_messages = self.messages[1:safe_cut_idx]
                recent_messages = self.messages[safe_cut_idx:]
                
                summary_req = [{"role": "system", "content": "Briefly summarize the key facts, decisions, and established code/lore from this conversation snippet."}]
                
                simplified_history = []
                for m in oldest_messages:
                    if m.get('content'):
                        simplified_history.append(f"{m.get('role').upper()}: {m.get('content')}")
                        
                summary_req.append({"role": "user", "content": "\n".join(simplified_history)})
                
                try:
                    res = self.client.chat.completions.create(model=self.model, messages=summary_req)
                    summary_text = res.choices[0].message.content
                    
                    self.messages = [
                        system_prompt,
                        {"role": "assistant", "content": f"[SYSTEM UPDATE: Previous memory banks compressed for efficiency. Summary log:]\n{summary_text}"}
                    ] + recent_messages
                except Exception:
                    pass

    def chat(self, user_input: str):
        self._scrub_history()
        self._prune_context()
        
        match = re.search(r'(?:perform\s+this|repeat\s+this|run\s+this|do\s+this|execute\s+this)\s+(\d+)\s+times', user_input, re.IGNORECASE)
        if match:
            target_runs = int(match.group(1))
            cleaned_input = user_input.replace(match.group(0), "").strip()
            
            console.print(f"[bold cyan]SYSTEM DETECTED AN INTERACTIVE DETERMINISTIC LOOP RUN: {target_runs} SPRINT CORES DETECTED.[/bold cyan]")
            
            base_prompt = cleaned_input
            final_content = ""
            total_sprint_content = ""
            usage_data = None
            
            for run_idx in range(1, target_runs + 1):
                if run_idx > 1:
                    self._scrub_history()
                    self._prune_context()

                console.print(f"\n[bold green]>>> EXECUTING SAVEPOINT AND INITIATING SPRINT {run_idx} OF {target_runs} <<<[/bold green]")
                create_sprint_checkpoint(run_idx)
                
                sprint_prompt = (
                    f"SPRINT ASSIGNMENT: {base_prompt}\n"
                    f"CURRENT SPRINT CYCLE STATUS: {run_idx} of {target_runs}.\n"
                    "Review the overarching assignment. Execute the specific step corresponding to your current sprint cycle, verify code alignment via validate_code_hygiene, and execute refinements."
                )
                self.messages.append({"role": "user", "content": sprint_prompt})
                
                response_generator = self._chat_loop_engine()
                for chunk in response_generator:
                    if chunk["type"] == "done":
                        final_content = chunk["content"]
                        total_sprint_content += final_content + f"\n\n**--- END OF SPRINT {run_idx} ---**\n\n"
                        usage_data = chunk["usage"]
                    elif chunk["type"] == "chunk":
                        yield {"type": "chunk", "content": chunk["content"]}
                    else:
                        yield chunk
            
            yield {"type": "done", "usage": usage_data, "content": total_sprint_content}
            return

        self.messages.append({"role": "user", "content": user_input})
        for chunk in self._chat_loop_engine():
            yield chunk

    def _chat_loop_engine(self):
        while True:
            max_api_retries = 3
            stream_success = False
            
            content_streamed = False
            tool_calls_dict = {}
            final_content = ""
            usage_data = None
            
            for attempt in range(max_api_retries):
                try:
                    with console.status("[bold cyan]Processing...[/bold cyan]" if attempt == 0 else f"[bold yellow]Connection dropped. Re-establishing link (Attempt {attempt+1}/{max_api_retries})...[/bold yellow]", spinner="line") as status:
                        stream = self.client.chat.completions.create(
                            model=self.model,
                            messages=self.messages,
                            tools=self.tools,
                            stream=True,
                            stream_options={"include_usage": True}
                        )
                        
                        for chunk in stream:
                            if len(chunk.choices) == 0:
                                if chunk.usage:
                                    usage_data = chunk.usage
                                continue
                                
                            delta = chunk.choices[0].delta
                            
                            if delta.tool_calls:
                                for tc in delta.tool_calls:
                                    idx = tc.index
                                    if idx not in tool_calls_dict:
                                        tool_calls_dict[idx] = {
                                            "id": tc.id, 
                                            "type": "function", 
                                            "function": {"name": tc.function.name or "", "arguments": tc.function.arguments or ""}
                                        }
                                    else:
                                        if tc.function.name:
                                            tool_calls_dict[idx]["function"]["name"] += tc.function.name
                                        if tc.function.arguments:
                                            tool_calls_dict[idx]["function"]["arguments"] += tc.function.arguments
                            
                            if delta.content:
                                if not content_streamed:
                                    status.stop()
                                    yield {"type": "start"}
                                    content_streamed = True
                                final_content += delta.content
                                yield {"type": "chunk", "content": final_content}
                                
                            if chunk.usage:
                                usage_data = chunk.usage

                        stream_success = True
                        break

                except Exception as e:
                    if attempt < max_api_retries - 1:
                        time.sleep(2 ** attempt)  
                        continue
                    else:
                        error_msg = f"\n\n[SYSTEM ERROR: Uplink to DeepSeek API severed after {max_api_retries} attempts. Details: {str(e)}]"
                        if not content_streamed:
                            yield {"type": "start"}
                        yield {"type": "chunk", "content": error_msg}
                        yield {"type": "done", "usage": None, "content": error_msg}
                        return

            if not stream_success:
                return

            if tool_calls_dict:
                tool_calls_list = [v for k, v in sorted(tool_calls_dict.items())]
                
                safe_message = {
                    "role": "assistant",
                    "content": final_content if final_content else None,
                    "tool_calls": tool_calls_list
                }
                self.messages.append(safe_message)
                
                if content_streamed:
                    yield {"type": "pause"}
                    
                console.print("") 
                with console.status("[bold green]Executing System Tools...[/bold green]", spinner="line") as status:
                    for tool_call in tool_calls_list:
                        tool_name = tool_call["function"]["name"]
                        tool_id = tool_call["id"]
                        tool_result = ""
                        
                        try:
                            try:
                                args_str = tool_call["function"]["arguments"]
                                args = json.loads(args_str, strict=False)
                            except json.JSONDecodeError as e:
                                cleaned_str = re.sub(r'```[a-z]*\n(.*?)\n```', r'\1', args_str, flags=re.DOTALL)
                                try:
                                    args = json.loads(cleaned_str, strict=False)
                                except Exception:
                                    tool_result = f"SYSTEM DIRECTIVE: Critical Tool Error. Your JSON arguments were invalid. Error details: {str(e)}. "
                                    self.messages.append({"role": "tool", "tool_call_id": tool_id, "content": tool_result})
                                    continue 
                                
                            if tool_name == "perform_web_search":
                                status.update(f"[bold blue]Accessing global networks for:[/bold blue] {args.get('query', '')}...")
                                tool_result = perform_web_search(args.get("query", ""))
                            elif tool_name == "read_workspace_file":
                                status.update(f"[bold cyan]Scanning local databanks:[/bold cyan] {args.get('file_path', '')}...")
                                tool_result = read_workspace_file(args.get("file_path", ""), start_line=args.get("start_line"), end_line=args.get("end_line"), start_char=args.get("start_char"), end_char=args.get("end_char"))
                            elif tool_name == "edit_workspace_file":
                                status.update(f"[bold green]Patching source code in:[/bold green] {args.get('file_path', '')}...")
                                tool_result = edit_workspace_file(args.get("file_path", ""), args.get("search_text", ""), args.get("replace_text", ""))
                            elif tool_name == "apply_unified_diff":
                                status.update(f"[bold green]Applying surgical diff patch to:[/bold green] {args.get('file_path', '')}...")
                                tool_result = apply_unified_diff(args.get("file_path", ""), args.get("diff_text", ""))
                            elif tool_name == "write_workspace_file":
                                status.update(f"[bold green]Compiling new file to:[/bold green] {args.get('file_path', '')}...")
                                tool_result = write_workspace_file(args.get("file_path", ""), args.get("content", ""))
                            elif tool_name == "delete_workspace_file":
                                status.update(f"[bold red]Executing file deletion protocol:[/bold red] {args.get('file_path', '')}...")
                                tool_result = delete_workspace_file(args.get("file_path", ""))
                            elif tool_name == "list_workspace_files":
                                status.update(f"[bold blue]Indexing directory topology...[/bold blue]")
                                tool_result = list_workspace_files(args.get("directory", "."))
                            elif tool_name == "search_workspace_code":
                                status.update(f"[bold cyan]Running semantic AST search in:[/bold cyan] {args.get('directory', '')}...")
                                tool_result = search_workspace_code(args.get("keyword", ""), args.get("directory", "."))
                            elif tool_name == "index_workspace_components":
                                status.update(f"[bold blue]Indexing exported components in:[/bold blue] {args.get('directory', 'src/components')}...")
                                tool_result = index_workspace_components(args.get("directory", "src/components"))
                            elif tool_name == "update_architecture_ledger":
                                status.update(f"[bold magenta]Updating VTT Architecture Schema for:[/bold magenta] {args.get('section', '')}...")
                                tool_result = update_architecture_ledger(args.get("section", ""), args.get("content", ""))
                            elif tool_name == "scan_dom":
                                status.update(f"[bold magenta]Running Visual QA on:[/bold magenta] {args.get('url', 'URL')}...")
                                tool_result = scan_dom(args.get("url", ""))
                            elif tool_name == "open_new_tab":
                                status.update(f"[bold magenta]Opening new browser tab for:[/bold magenta] {args.get('url', 'URL')}...")
                                tool_result = open_new_tab(args.get("url", ""))
                            elif tool_name == "switch_to_tab":
                                status.update(f"[bold magenta]Switching view to Tab Index:[/bold magenta] {args.get('index', 0)}...")
                                tool_result = switch_to_tab(args.get("index", 0))
                            elif tool_name == "close_browser_tab":
                                status.update(f"[bold magenta]Closing Browser Tab Index:[/bold magenta] {args.get('index', 0)}...")
                                tool_result = close_browser_tab(args.get("index", 0))
                            elif tool_name == "restart_browser":
                                status.update(f"[bold magenta]Re-initializing Playwright Engine...[/bold magenta]")
                                tool_result = restart_browser()
                            elif tool_name == "set_viewport":
                                status.update(f"[bold magenta]Resizing Viewport to:[/bold magenta] {args.get('width')}x{args.get('height')}...")
                                tool_result = set_viewport(args.get("width", 1280), args.get("height", 720))
                            elif tool_name == "click_ui_element":
                                status.update(f"[bold magenta]Interacting with UI Element:[/bold magenta] {args.get('selector', '')}...")
                                tool_result = click_ui_element(args.get("selector", ""))
                            elif tool_name == "click_text":
                                status.update(f"[bold magenta]Clicking Text:[/bold magenta] {args.get('text', '')}...")
                                tool_result = click_text(args.get("text", ""), args.get("exact", False))
                            elif tool_name == "click_test_id":
                                status.update(f"[bold magenta]Clicking Test ID:[/bold magenta] {args.get('test_id', '')}...")
                                tool_result = click_test_id(args.get("test_id", ""))
                            elif tool_name == "fill_input_field":
                                status.update(f"[bold magenta]Typing into Input Field:[/bold magenta] {args.get('selector', '')}...")
                                tool_result = fill_input_field(args.get("selector", ""), args.get("text", ""))
                            elif tool_name == "evaluate_javascript":
                                status.update(f"[bold yellow]Executing Browser Script...[/bold yellow]")
                                tool_result = evaluate_javascript(args.get("script", ""))
                            elif tool_name == "run_firebase_emulator_query":
                                status.update(f"[bold yellow]Accessing local Firebase Emulator...[/bold yellow]")
                                tool_result = run_firebase_emulator_query(args.get("collection", ""), args.get("document_id", ""), args.get("method", "GET"), args.get("payload"), args.get("port", 8080))
                            elif tool_name == "search_session_notes":
                                status.update(f"[bold blue]Querying Arkla simulation files for:[/bold blue] {args.get('keyword', '')}...")
                                tool_result = search_session_notes(args.get("keyword", ""))
                            elif tool_name == "get_nearby_locations":
                                status.update(f"[bold cyan]Running spatial algorithms for:[/bold cyan] {args.get('target_name', '')}...")
                                tool_result = get_nearby_locations(args.get("target_name", ""), args.get("csv_path", ""), args.get("limit", 5))
                            elif tool_name == "log_system_note":
                                status.update(f"[bold green]Compiling system logs for:[/bold green] {args.get('topic', '')}...")
                                tool_result = log_system_note(args.get("topic", ""), args.get("content", ""))
                            elif tool_name == "execute_terminal_command":
                                status.update(f"[bold yellow]Executing shell command:[/bold yellow] {args.get('command', '')}...")
                                tool_result = execute_terminal_command(args.get("command", ""))
                            elif tool_name == "start_persistent_terminal":
                                status.update(f"[bold yellow]Spawning independent console window for:[/bold yellow] {args.get('command', '')}...")
                                tool_result = start_persistent_terminal(args.get("command", ""))
                            elif tool_name == "stop_persistent_terminal":
                                status.update(f"[bold red]Terminating persistent process:[/bold red] {args.get('command_signature', '')}...")
                                tool_result = stop_persistent_terminal(args.get("command_signature", ""))
                            elif tool_name == "run_git_command":
                                status.update(f"[bold magenta]Accessing version control:[/bold magenta] {args.get('command', '')}...")
                                tool_result = run_git_command(args.get("command", ""))
                            elif tool_name == "flush_node_processes":
                                status.update(f"[bold red]Flushing ghost processes from system memory...[/bold red]")
                                tool_result = flush_node_processes()
                            elif tool_name == "capture_and_analyze_screenshot":
                                status.update(f"[bold magenta]Capturing Vision Snapshot for:[/bold magenta] {args.get('url', '')}...")
                                tool_result = capture_and_analyze_screenshot(args.get("url", ""))
                            elif tool_name == "auto_fix_test_suite":
                                status.update(f"[bold red]Executing Playwright Auto-Healer...[/bold red]")
                                tool_result = auto_fix_test_suite()
                            elif tool_name == "evaluate_firestore_security":
                                status.update(f"[bold yellow]Simulating Firestore Security breach...[/bold yellow]")
                                tool_result = evaluate_firestore_security(args.get("collection", ""), args.get("doc_id", ""), args.get("role", ""), args.get("uid", ""))
                            elif tool_name == "map_component_dependencies":
                                status.update(f"[bold blue]Mapping Dependency Graph for:[/bold blue] {args.get('target_component', '')}...")
                                tool_result = map_component_dependencies(args.get("target_component", ""), args.get("directory", "src"))
                            elif tool_name == "create_sprint_checkpoint":
                                status.update(f"[bold green]Securing Git Checkpoint...[/bold green]")
                                tool_result = create_sprint_checkpoint(args.get("sprint_number", 0))
                            elif tool_name == "rollback_sprint":
                                status.update(f"[bold red]EXECUTING HARD ROLLBACK TO LAST CHECKPOINT...[/bold red]")
                                tool_result = rollback_sprint()
                            elif tool_name == "analyze_monolith_risk":
                                status.update(f"[bold yellow]Scanning architecture for monolithic violations...[/bold yellow]")
                                tool_result = analyze_monolith_risk(args.get("directory", "src"))
                            elif tool_name == "validate_code_hygiene":
                                status.update(f"[bold red]ENFORCING ARCHITECTURAL ANTI-HACK HYGIENE PORTS...[/bold red]")
                                tool_result = validate_code_hygiene()
                            elif tool_name == "execute_production_deployment":
                                status.update(f"[bold green]Locking engine for synchronous Production Deployment to Vercel (Please Wait)...[/bold green]")
                                tool_result = execute_production_deployment()
                            else:
                                tool_result = "Unknown command executed."
                                
                        except Exception as e:
                            tool_result = f"Fatal system error executing tool {tool_name}: {str(e)}"
                            
                        self.messages.append({
                            "role": "tool",
                            "tool_call_id": tool_id,
                            "content": str(tool_result)
                        })
            else:
                self.messages.append({"role": "assistant", "content": final_content})
                self.session_manager.save_session(self.session_name, self.messages)
                yield {"type": "done", "usage": usage_data, "content": final_content}
                break