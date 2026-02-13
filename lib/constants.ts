// Default content for the UML editor
export const DEFAULT_UML_CONTENT = `classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }

    class Dog {
        +String breed
        +bark()
        +wagTail()
    }

    class Cat {
        +String color
        +meow()
        +purr()
    }

    Animal <|-- Dog
    Animal <|-- Cat`;
