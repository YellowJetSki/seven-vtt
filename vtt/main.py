import sys
import time
from pathlib import Path
from dotenv import load_dotenv
from core.ui import display_welcome, print_system, get_user_input, get_workspace_choice, get_live_panel, update_live_panel
from core.llm_client import DeepSeekAgent

def main():
    load_dotenv()
    
    while True:
        try:
            display_welcome()
            workspace_choice = get_workspace_choice()
            agent = DeepSeekAgent(workspace_choice)
            print_system(f"Baldeepicius online. Operational protocol '{agent.session_name}' engaged.")
            print_system("Active protocols: /switch (Change Mode) | /clear (Wipe Memory) | /undo (Rollback) | /export (Save Logs) | exit")
            print_system("Override: Press [Ctrl+C] while generating to CANCEL. Press [Ctrl+C] while idle to EXIT.\n")
            
        except ValueError as e:
            print_system(f"Critical Systems Failure: {e}")
            sys.exit(1)
        except KeyboardInterrupt:
            print_system("\nPowering down.")
            sys.exit(0)
            
        while True:
            # --- 1. IDLE STATE: Ctrl+C will EXIT the application ---
            try:
                user_input = get_user_input(agent.role_name)
            except KeyboardInterrupt:
                print_system("\nManual override detected. Saving logs and terminating safely.")
                sys.exit(0)
                
            if user_input.lower() in ['exit', 'quit']:
                print_system("Saving session logs and powering down systems. Goodbye, sir.")
                sys.exit(0)
                
            if not user_input.strip():
                continue
                
            # --- LOCAL SLASH COMMANDS INTERCEPTOR ---
            if user_input.startswith("/"):
                cmd = user_input.lower().strip()
                
                if cmd == "/switch":
                    print_system("Saving logs and recalibrating systems...\n")
                    time.sleep(0.5)
                    break
                    
                elif cmd == "/clear":
                    agent.messages = [agent.messages[0]]
                    agent.session_manager.save_session(agent.session_name, agent.messages)
                    print_system(f"Memory banks wiped for protocol {agent.session_name}. Awaiting input.")
                    continue
                    
                elif cmd == "/undo":
                    last_user_idx = -1
                    for i in range(len(agent.messages)-1, 0, -1):
                        if agent.messages[i].get("role") == "user":
                            last_user_idx = i
                            break
                            
                    if last_user_idx != -1:
                        agent.messages = agent.messages[:last_user_idx]
                        agent.session_manager.save_session(agent.session_name, agent.messages)
                        print_system("Last interaction expunged. Timeline reverted to previous state.")
                    else:
                        print_system("Memory banks are already at baseline. Nothing to undo.")
                    continue
                    
                elif cmd == "/export":
                    export_dir = Path("exports")
                    export_dir.mkdir(exist_ok=True)
                    export_file = export_dir / f"{agent.session_name}_{int(time.time())}.md"
                    
                    with open(export_file, "w", encoding="utf-8") as f:
                        f.write(f"# System Log Export: {agent.session_name}\n\n")
                        for msg in agent.messages:
                            if msg['role'] == 'user':
                                f.write(f"### **{agent.role_name}**\n{msg['content']}\n\n")
                            elif msg['role'] == 'assistant':
                                if msg.get('content'):
                                    f.write(f"### **Baldeepicius**\n{msg['content']}\n\n")
                                
                    print_system(f"Successfully exported data logs to {export_file}")
                    continue
                    
                else:
                    print_system(f"Unrecognized command '{cmd}'. Available protocols: /switch, /clear, /undo, /export")
                    continue
            # ----------------------------------------
            
            # --- 2. GENERATING STATE: Ctrl+C will CANCEL the process ---
            try:
                response_generator = agent.chat(user_input)
                live_context = None
                
                for event in response_generator:
                    if event["type"] == "start":
                        live_context = get_live_panel()
                        live_context.start()
                    elif event["type"] == "chunk":
                        if live_context:
                            update_live_panel(live_context, event["content"])
                    elif event["type"] == "pause":
                        if live_context:
                            live_context.stop()
                            live_context = None
                    elif event["type"] == "done":
                        if live_context:
                            update_live_panel(live_context, event["content"], event.get("usage"))
                            live_context.stop()
                            
            except KeyboardInterrupt:
                # Catch the interrupt, stop the UI panel gracefully
                if live_context:
                    live_context.stop()
                    
                print_system("\n[bold red]System Override:[/bold red] Process forcefully halted. Awaiting new parameters.")
                
                # Append a system note so the AI's memory doesn't get confused by the missing response
                agent.messages.append({
                    "role": "user",
                    "content": "[SYSTEM OVERRIDE: The user forcefully halted your previous action. Await their next instruction.]"
                })
                agent.session_manager.save_session(agent.session_name, agent.messages)
                continue
                
            except Exception as e:
                if 'live_context' in locals() and live_context:
                    live_context.stop()
                print_system(f"System execution error: {str(e)}")

if __name__ == "__main__":
    main()