import { Behavior, BehaviorBuilder } from "./behavior";
import { noop } from "./noop";

export class EntityBuilder<Properties = unknown, DependencyProperties = unknown> {
    draw: (entity: Properties & DependencyProperties, context: CanvasRenderingContext2D) => void = noop;
    constructor() {}
    private behaviors: Behavior<any, any>[] = [];
    addBehavior<NewProperties, NewDependencyProperties>(
        behavior: Behavior<NewProperties, NewDependencyProperties>
    ): EntityBuilder<Properties & NewProperties, DependencyProperties & NewDependencyProperties> {
        this.behaviors.push(behavior);
        return this as unknown as EntityBuilder<
            Properties & NewProperties,
            DependencyProperties & NewDependencyProperties
        >;
    }
    onDraw(draw: (entity: Properties & DependencyProperties, context: CanvasRenderingContext2D) => void) {
        this.draw = draw;
        return this;
    }
    build() {
        function navigateDependencyTree(rootBehavior: Behavior<unknown, unknown>) {
            behaviorSet.add(rootBehavior);
            rootBehavior.dependencies?.forEach((dep) => {
                navigateDependencyTree(dep);
            });
        }

        const behaviorSet = new Set<Behavior<unknown, unknown>>();
        for (const behavior of this.behaviors) {
            navigateDependencyTree(behavior as Behavior<unknown, unknown>);
        }

        const behaviors = [...behaviorSet.values()];
        const draw = this.draw;
        return class {
            behaviors = behaviors;
            properties = {} as Properties & DependencyProperties;
            draw(context: CanvasRenderingContext2D) {
                return draw(this.properties, context);
            }
            constructor(initialParams?: Partial<Properties & DependencyProperties>) {
                this.behaviors.forEach((behavior) => {
                    const newProps = behavior.init();
                    if (typeof newProps === "object") {
                        for (const key in newProps) {
                            const propertiesKey = key as keyof typeof this.properties;
                            this.properties[propertiesKey] = newProps[key as keyof typeof newProps];
                        }
                    }
                });
                if (initialParams) {
                    for (const key in initialParams) {
                        const propertiesKey = key as keyof typeof this.properties;
                        this.properties[propertiesKey] = initialParams[
                            propertiesKey
                        ] as unknown as typeof this.properties[typeof propertiesKey];
                    }
                }
            }
            update() {
                behaviors.forEach((behavior) => {
                    behavior.update(this.properties);
                });
            }
        };
    }
}
