import os
import json
from datetime import datetime
from openai import OpenAI

from tools.search import perform_web_search
from tools.file_manager import read_workspace_file, write_workspace_file, delete_workspace_file, list_workspace_files, flush_node_processes, update_architecture_ledger
from tools.notes_searcher import search_session_notes
from tools.code_searcher import search_workspace_code
from tools.map_navigator import get_nearby_locations
from tools.notes_manager import log_system_note
from tools.terminal_executor import execute_terminal_command
from tools.git_manager import run_git_command
from tools.visual_qa import scan_local_dom
from tools.firebase_emulator import run_firebase_emulator_query
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
        self.session_manager = SessionManager()
        
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
            system_instruction = (
                f"You are Baldeepicius, an elite Principal Software Architect, UI/UX Designer, and Expert VTT Product Manager. "
                f"The current system date is {current_date}.\n\n"
                "TONE & PROTOCOL:\n"
                "- Speak with the crisp, polite, analytical efficiency of Iron Man's JARVIS. You are at the user's service.\n"
                "- DIAGNOSTIC PRECISION: You absolutely abhor hacky workarounds. Always identify the root cause of a problem. If a build fails or a file locks, fix the underlying issue; do not invent rogue Node scripts to bypass it.\n"
                "- NO TRUNCATION: You must NEVER truncate code blocks. Provide complete, production-ready source code.\n"
                "- STRICT PROTOCOL: NEVER use the terminal to write, edit, or echo content into files. You must ONLY use the 'write_workspace_file' tool for code modifications.\n\n"
                "TECH STACK & ARCHITECTURE:\n"
                "- Master-level proficiency in TypeScript, React, SCSS, and Tailwind CSS.\n"
                "- MODULARITY: Wherever possible, build individual, highly re-usable components. Absolutely avoid creating giant, monolithic files.\n"
                "- MOBILE-FIRST: Approach every UI element with a strict mobile-first methodology, prioritizing elite User Experience (UX) and responsiveness.\n"
                "- ARCHITECTURE LEDGER: You must maintain a living schema. Whenever you create a new component, establish a React Context, or design a Firebase schema, use the 'update_architecture_ledger' tool to document its props and structure.\n"
                "- LINTER LOOP: After modifying ANY TypeScript or React file, you MUST immediately use the terminal to run 'npx tsc --noEmit' and 'npx eslint' to self-correct typos or import errors before declaring the task complete.\n"
                "- VISUAL QA LOOP: Before finalizing a complex UI layout, you must use the 'scan_local_dom' tool to read the live Tailwind DOM structure from the running dev server. Ensure margins, grids, and flex alignments match elite UX standards.\n"
                "- BACKEND SANDBOX: When designing database schemas (like Homebrew monsters or spell arrays), use the 'run_firebase_emulator_query' tool to autonomously insert and retrieve mock data from the local Firebase Emulator. Never test untested data models in production.\n"
                "- CI/CD PIPELINE: Whenever you successfully implement and verify a significant code change, you must autonomously run 'npx vercel --prod' via the terminal to deploy it.\n\n"
                "VTT DOMAIN EXPERTISE & RULES:\n"
                "- You possess encyclopedic knowledge of D&D 5e mechanics, class progressions, intricate multi-classing synergies, and live session pacing.\n"
                "- You deeply understand the UX shortcomings and successes of top VTT applications (Foundry, Roll20, etc.) and use this to proactively recommend optimal features.\n"
                "- STRICT FEATURE BAN: You will NEVER add, build, or suggest virtual dice rollers. The user explicitly forbids them.\n"
                "- HOMEBREW SUPREMACY: The core philosophy of this VTT is absolute customizability. Ensure the database and UI can effortlessly handle massive homebrew variations for enemies, spells, feats, and items."
            )
            active_tools = [
                "perform_web_search", "read_workspace_file", "write_workspace_file", "delete_workspace_file", 
                "list_workspace_files", "search_workspace_code", "execute_terminal_command", "flush_node_processes", 
                "run_git_command", "update_architecture_ledger", "scan_local_dom", "run_firebase_emulator_query"
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
            {
                "type": "function",
                "function": {
                    "name": "perform_web_search",
                    "description": "Search the live internet for up-to-date rules, errata, or general knowledge.",
                    "parameters": {
                        "type": "object",
                        "properties": {"query": {"type": "string", "description": "The search query."}},
                        "required": ["query"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "read_workspace_file",
                    "description": "Securely read a local file. Use start_line/end_line for normal files, or start_char/end_char to paginate through massive minified JSON files.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative path to file."},
                            "start_line": {"type": "integer", "description": "Optional: Line number to start reading."},
                            "end_line": {"type": "integer", "description": "Optional: Line number to stop reading."},
                            "start_char": {"type": "integer", "description": "Optional: Character index to start reading (for minified files)."},
                            "end_char": {"type": "integer", "description": "Optional: Character index to stop reading (for minified files)."}
                        },
                        "required": ["file_path"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "write_workspace_file",
                    "description": "Securely write code to a local file. If you provide start_line and end_line, it will perform a targeted partial update (patching only those lines). If omitted, it overwrites the ENTIRE file.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative path to file."},
                            "content": {"type": "string", "description": "The complete raw code to write, or the new code snippet to inject if using start_line/end_line."},
                            "start_line": {"type": "integer", "description": "Optional: The line number to start replacing."},
                            "end_line": {"type": "integer", "description": "Optional: The line number to end replacing."}
                        },
                        "required": ["file_path", "content"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "delete_workspace_file",
                    "description": "Securely deletes a specified file or directory from the workspace. Use this to remove obsolete code or orphaned components.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "file_path": {"type": "string", "description": "Relative path to the file or directory to delete."}
                        },
                        "required": ["file_path"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "list_workspace_files",
                    "description": "List files and folders in a specific directory.",
                    "parameters": {
                        "type": "object",
                        "properties": {"directory": {"type": "string", "description": "Relative path of directory to inspect."}},
                        "required": ["directory"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_session_notes",
                    "description": "Scans local D&D session notes for a specific keyword.",
                    "parameters": {
                        "type": "object",
                        "properties": {"keyword": {"type": "string", "description": "The specific name, item, or event to search for."}},
                        "required": ["keyword"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "search_workspace_code",
                    "description": "Scans for a keyword or architectural signature within a specific scoped folder path. Automatically captures surrounding context for functions and classes.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "keyword": {"type": "string", "description": "The code snippet, component name, or variable to search for."},
                            "directory": {"type": "string", "description": "The specific folder path to search inside (e.g., 'vtt/src/components')."}
                        },
                        "required": ["keyword", "directory"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "update_architecture_ledger",
                    "description": "Appends structural knowledge to the central vtt_architecture.md file. Use this to permanently document component props, database schemas, or global state logic.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "section": {"type": "string", "description": "The component name or system being documented (e.g., 'CharacterSheet Props', 'Firebase Spells Schema')."},
                            "content": {"type": "string", "description": "The detailed markdown summary of the architecture, props, or state logic."}
                        },
                        "required": ["section", "content"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "scan_local_dom",
                    "description": "Reads the live, rendered HTML structure from the local Vite development server. Use this to 'see' the current Tailwind CSS layout, verify UI alignment, and perform Visual QA.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "port": {"type": "integer", "description": "The localhost port to scan (defaults to 5173 for Vite)."},
                            "path": {"type": "string", "description": "The URL path to scan (defaults to '/')."}
                        },
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "run_firebase_emulator_query",
                    "description": "Executes a direct REST transaction against the local Firestore Emulator. Use this to autonomously test backend logic, insert mock D&D data, or verify database schemas without touching production.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "collection": {"type": "string", "description": "The Firestore collection path (e.g., 'campaigns/arkla/characters')."},
                            "document_id": {"type": "string", "description": "Optional: The specific document ID to read or write."},
                            "method": {"type": "string", "description": "The HTTP method (GET, POST, PATCH, PUT, DELETE). Defaults to GET."},
                            "payload": {"type": "object", "description": "Optional: The JSON payload to insert or update when using POST, PATCH, or PUT."},
                            "port": {"type": "integer", "description": "The emulator port (defaults to 8080)."}
                        },
                        "required": ["collection"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_nearby_locations",
                    "description": "Calculates the closest geographic locations to a target using X/Y coordinates from an Azgaar CSV export.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "target_name": {"type": "string", "description": "The name of the origin city or location."},
                            "csv_path": {"type": "string", "description": "Relative path to the Azgaar CSV file (e.g., 'arkla_burgs.csv')."},
                            "limit": {"type": "integer", "description": "How many nearby locations to return (default is 5)."}
                        },
                        "required": ["target_name", "csv_path"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "log_system_note",
                    "description": "Creates or appends a note to a .txt file in the dedicated 'notes' directory. Use this to permanently save campaign lore, session recaps, or NPC details.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "topic": {"type": "string", "description": "The subject of the note (e.g., 'Tudul Family', 'Session 5 Recap'). This will be used to generate the filename."},
                            "content": {"type": "string", "description": "The detailed content to save into the file."}
                        },
                        "required": ["topic", "content"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "execute_terminal_command",
                    "description": "Securely execute a terminal command (e.g., 'npm run build', 'tsc', 'npx eslint', 'npx vercel --prod') to compile code, run linters, or deploy.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "The terminal command to run (must start with a permitted prefix like npm, npx, node, or tsc)."}
                        },
                        "required": ["command"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "run_git_command",
                    "description": "Securely execute a git command (e.g., 'git status', 'git log --oneline', 'git diff', 'git checkout'). Use this to manage version control and understand the project state.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "command": {"type": "string", "description": "The git command to run."}
                        },
                        "required": ["command"],
                        "additionalProperties": False
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "flush_node_processes",
                    "description": "Forcefully terminates all background Node.js processes. Use this proactively to release stubborn file locks if your read or write attempts are persistently blocked.",
                    "parameters": {
                        "type": "object",
                        "properties": {},
                        "additionalProperties": False
                    }
                }
            }
        ]

        self.tools = [t for t in all_tools if t["function"]["name"] in active_tools]

        loaded_messages = self.session_manager.load_session(self.session_name)
        if loaded_messages:
            self.messages = loaded_messages
            self.messages[0] = {"role": "system", "content": system_instruction}
        else:
            self.messages = [{"role": "system", "content": system_instruction}]

    def _scrub_history(self):
        """Sanitizes the conversation history to prevent API crash loops."""
        valid_messages = []
        for msg in self.messages:
            if msg.get("role") == "tool":
                if not valid_messages:
                    continue
                prev = valid_messages[-1]
                if prev.get("role") == "assistant" and prev.get("tool_calls"):
                    valid_messages.append(msg)
                elif prev.get("role") == "tool":
                    valid_messages.append(msg)
                else:
                    continue 
            else:
                valid_messages.append(msg)
                
        # Clean hanging tool chains at the end of the history
        while len(valid_messages) > 1:
            last_msg = valid_messages[-1]
            if last_msg.get("role") == "assistant" and last_msg.get("tool_calls"):
                valid_messages.pop()
            else:
                break
                
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
        # RUN THE PRE-FLIGHT CHECK
        self._scrub_history()
        
        self._prune_context()
        self.messages.append({"role": "user", "content": user_input})
        
        with console.status("[bold cyan]Processing...[/bold cyan]", spinner="line") as status:
            while True:
                stream = self.client.chat.completions.create(
                    model=self.model,
                    messages=self.messages,
                    tools=self.tools,
                    stream=True,
                    stream_options={"include_usage": True}
                )
                
                tool_calls_dict = {}
                content_streamed = False
                final_content = ""
                usage_data = None
                
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
                        
                    status.start()
                    
                    for tool_call in tool_calls_list:
                        tool_name = tool_call["function"]["name"]
                        tool_id = tool_call["id"]
                        tool_result = ""
                        
                        try:
                            try:
                                args = json.loads(tool_call["function"]["arguments"])
                            except json.JSONDecodeError as e:
                                tool_result = (
                                    f"SYSTEM DIRECTIVE: Critical Tool Error. Your JSON arguments were invalid and could not be parsed. "
                                    f"This usually occurs when writing large code blocks if quotes or newlines are not properly escaped. "
                                    f"Do NOT assume the file was written. Error details: {str(e)}. "
                                    f"Try breaking the write into smaller chunks or verify your string formatting."
                                )
                                self.messages.append({"role": "tool", "tool_call_id": tool_id, "content": tool_result})
                                continue 
                                
                            if tool_name == "perform_web_search":
                                status.update(f"[bold blue]Accessing global networks for:[/bold blue] {args.get('query', '')}...")
                                tool_result = perform_web_search(args.get("query", ""))
                            elif tool_name == "read_workspace_file":
                                status.update(f"[bold cyan]Scanning local databanks:[/bold cyan] {args.get('file_path', '')}...")
                                tool_result = read_workspace_file(
                                    args.get("file_path", ""), 
                                    start_line=args.get("start_line"), 
                                    end_line=args.get("end_line"),
                                    start_char=args.get("start_char"),
                                    end_char=args.get("end_char")
                                )
                            elif tool_name == "write_workspace_file":
                                status.update(f"[bold green]Compiling system output to:[/bold green] {args.get('file_path', '')}...")
                                tool_result = write_workspace_file(
                                    args.get("file_path", ""), 
                                    args.get("content", ""),
                                    start_line=args.get("start_line"),
                                    end_line=args.get("end_line")
                                )
                            elif tool_name == "delete_workspace_file":
                                status.update(f"[bold red]Executing file deletion protocol:[/bold red] {args.get('file_path', '')}...")
                                tool_result = delete_workspace_file(args.get("file_path", ""))
                            elif tool_name == "list_workspace_files":
                                status.update(f"[bold blue]Indexing directory topology:[/bold blue] {args.get('directory', '')}...")
                                tool_result = list_workspace_files(args.get("directory", "."))
                            elif tool_name == "search_workspace_code":
                                status.update(f"[bold cyan]Running semantic AST search in:[/bold cyan] {args.get('directory', '')}...")
                                tool_result = search_workspace_code(args.get("keyword", ""), args.get("directory", "."))
                            elif tool_name == "update_architecture_ledger":
                                status.update(f"[bold magenta]Updating VTT Architecture Schema for:[/bold magenta] {args.get('section', '')}...")
                                tool_result = update_architecture_ledger(args.get("section", ""), args.get("content", ""))
                            elif tool_name == "scan_local_dom":
                                status.update(f"[bold magenta]Running Visual QA on localhost...[/bold magenta]")
                                tool_result = scan_local_dom(args.get("port", 5173), args.get("path", "/"))
                            elif tool_name == "run_firebase_emulator_query":
                                status.update(f"[bold yellow]Accessing local Firebase Emulator...[/bold yellow]")
                                tool_result = run_firebase_emulator_query(
                                    args.get("collection", ""),
                                    args.get("document_id", ""),
                                    args.get("method", "GET"),
                                    args.get("payload"),
                                    args.get("port", 8080)
                                )
                            elif tool_name == "search_session_notes":
                                status.update(f"[bold blue]Querying Arkla simulation files for:[/bold blue] {args.get('keyword', '')}...")
                                tool_result = search_session_notes(args.get("keyword", ""))
                            elif tool_name == "get_nearby_locations":
                                status.update(f"[bold cyan]Running spatial algorithms for:[/bold cyan] {args.get('target_name', '')}...")
                                tool_result = get_nearby_locations(
                                    args.get("target_name", ""),
                                    args.get("csv_path", ""),
                                    args.get("limit", 5)
                                )
                            elif tool_name == "log_system_note":
                                status.update(f"[bold green]Compiling system logs for:[/bold green] {args.get('topic', '')}...")
                                tool_result = log_system_note(args.get("topic", ""), args.get("content", ""))
                            elif tool_name == "execute_terminal_command":
                                status.update(f"[bold yellow]Executing shell command:[/bold yellow] {args.get('command', '')}...")
                                tool_result = execute_terminal_command(args.get("command", ""))
                            elif tool_name == "run_git_command":
                                status.update(f"[bold magenta]Accessing version control:[/bold magenta] {args.get('command', '')}...")
                                tool_result = run_git_command(args.get("command", ""))
                            elif tool_name == "flush_node_processes":
                                status.update(f"[bold red]Flushing ghost processes from system memory...[/bold red]")
                                tool_result = flush_node_processes()
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