from rich.console import Console
from rich.panel import Panel
from rich.text import Text
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich.live import Live
from rich.align import Align

console = Console()

def display_welcome():
    """
    Renders the sleek, JARVIS-style Baldeepicius boot sequence.
    """
    console.clear()
    title = Text("B A L D E E P I C I U S", style="bold cyan", justify="center")
    subtitle = Text("Intelligent Systems Interface & VTT Architect", style="dim white", justify="center")
    divider = Text("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", style="blue", justify="center")
    
    content = Text.assemble(title, "\n", subtitle, "\n\n", divider)
    
    panel = Panel(
        content,
        border_style="cyan",
        expand=False,
        padding=(1, 4)
    )
    console.print(Align.center(panel))
    console.print("\n")

def get_workspace_choice() -> str:
    console.print("[bold cyan]Select Operational Protocol:[/bold cyan]", justify="center")
    console.print("[1] 🐉 [bold red]Arkla Simulation[/bold red] (Tactical DM Co-Pilot)", justify="center")
    console.print("[2] 💻 [bold blue]VTT Systems[/bold blue] (Frontend Architecture)", justify="center")
    console.print("[3] 🌐 [bold green]Global Network[/bold green] (General Intelligence)", justify="center")
    
    choice = Prompt.ask(
        "\n[bold yellow]Standing by for instructions, sir[/bold yellow]",
        choices=["1", "2", "3"],
        default="1"
    )
    return choice

def get_live_panel():
    """Returns an active rich Live context for true streaming."""
    return Live(Panel(Markdown(""), title="[bold cyan]Baldeepicius[/bold cyan]", border_style="cyan"), refresh_per_second=20)

def update_live_panel(live_context, content: str, usage=None):
    """Updates the Live panel with real-time text and an optional cost footer."""
    if usage:
        # Based on standard DeepSeek API pricing
        cost = (usage.prompt_tokens * 0.14 / 1_000_000) + (usage.completion_tokens * 0.28 / 1_000_000)
        footer = f"\n\n---\n*[dim]System Resources: {usage.total_tokens} tokens | Est. Cost: ${cost:.5f}[/dim]*"
        content += footer
        
    live_context.update(Panel(Markdown(content), title="[bold cyan]Baldeepicius[/bold cyan]", border_style="cyan"))

def print_system(message: str):
    console.print(f"[bold blue]System Update:[/bold blue] {message}")
    
def get_user_input(role_name: str = "Michael") -> str:
    return console.input(f"\n[bold white]{role_name}:[/bold white] ")