import { returnsEmpty, noop } from "./noop";

type GetPropertiesForBehavior<T> = T extends Behavior<infer Properties> ? Properties : never;

export interface Behavior<Properties = Record<string, unknown>, DependencyProperties = unknown> {
    readonly init: () => Properties;
    readonly update: (entity: Properties) => void;
    readonly cleanup: (entity: Properties) => void;
    readonly dependencies: Behavior<DependencyProperties>[];
}

export class BehaviorBuilder<Properties = unknown, DependencyProperties = unknown> {
    dependencies: Behavior<DependencyProperties>[] = [];
    private updateFunction: (ent: Properties) => void = noop;
    private cleanupFunction: (ent: Properties) => void = noop;
    constructor(private properties: Properties) {}
    addDependency<Props extends Record<string, unknown>>(
        dep: Behavior<Props>
    ): BehaviorBuilder<Properties & GetPropertiesForBehavior<Behavior<Props>>> {
        this.dependencies.push(dep as unknown as Behavior<DependencyProperties>);
        return this as unknown as BehaviorBuilder<Properties & GetPropertiesForBehavior<Behavior<Props>>>;
    }
    onUpdate(updateFunction: (ent: Properties) => void) {
        this.updateFunction = updateFunction;
        return this;
    }
    build(): Behavior<Properties, DependencyProperties> {
        return {
            init: () => this.properties,
            update: this.updateFunction,
            cleanup: this.cleanupFunction,
            dependencies: this.dependencies,
        };
    }
}
