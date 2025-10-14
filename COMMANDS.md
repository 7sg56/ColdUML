# ColdUML Command Reference

ColdUML supports PlantUML-style commands for customizing your diagrams.

## Flow Direction Commands

### Class Diagrams
```mermaid
classDiagram
    direction TB  %% Top to Bottom (default)
    direction TD  %% Top Down (same as TB)
    direction LR  %% Left to Right
    direction RL  %% Right to Left
```

### Use Case Diagrams
```mermaid
graph TB     %% Top to Bottom
graph TD     %% Top Down (same as TB)
graph LR     %% Left to Right
graph RL     %% Right to Left
```

## Diagram Elements

### Class Diagram Syntax
- `+` Public members
- `-` Private members
- `#` Protected members
- `~` Package/Internal members
- `<|--` Inheritance (extends)
- `-->` Association
- `--*` Composition
- `--o` Aggregation

### Use Case Diagram Syntax
- `((Actor))` - Actors (round nodes)
- `[Use Case]` - Use cases (rectangular)
- `{{System}}` - Systems (diamond-shaped)
- `-->` - Relationships/connections

## Color and Styling

ColdUML uses Gruvbox color scheme:
- **Light theme**: Warm, cream background with earthy tones
- **Dark theme**: Dark background with muted, comfortable colors
- **Accent color**: Green (`#8ec07c`) for highlights and active elements

## Comments

Use `%%` for comments in your diagrams:
```mermaid
graph LR
    A --> B  %% This is a comment
    %% Comments are ignored in rendering
```

## Best Practices

1. **Use direction commands** at the top of your diagrams for consistent layout
2. **Group related elements** together for better readability
3. **Use meaningful names** for classes, use cases, and actors
4. **Add comments** to explain complex relationships
5. **Test different directions** to find the best layout for your content

## Template Examples

The built-in templates demonstrate:
- Basic class inheritance patterns
- Advanced use case flows with systems
- Horizontal and vertical layouts
- PlantUML-style direction commands

Switch between templates using the buttons in the editor to see different approaches and styling options.