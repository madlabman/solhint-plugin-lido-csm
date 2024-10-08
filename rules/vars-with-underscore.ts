import BaseChecker from 'solhint/lib/rules/base-checker';
import naming from 'solhint/lib/common/identifier-naming';

const DEFAULT_SEVERITY: string = 'warn';

const ruleId: string = 'vars-with-underscore';
const meta = {
  type: 'naming',
  docs: {
    description: 'Set of rules to check underscored variables.',
    category: 'Style Guide Rules',
  },
  isDefault: true,
  recommended: true,
  defaultSetup: [DEFAULT_SEVERITY],
};

export class VarsWithUnderscoreChecker extends BaseChecker implements Rule {
  private inInterface: boolean = false;
  private arguments: string[] = [];
  private globals: string[] = [];

  constructor(reporter: Function) {
    super(reporter, ruleId, meta);
  }

  ContractDefinition(node: any) {
    this.inInterface = node.kind == 'interface';
    for (const n of node.subNodes) {
      if (n.type === 'FunctionDefinition') {
        this.globals.push(n.name);
      }
    }
  }

  'ContractDefinition:exit'() {
    this.inInterface = false;
    this.globals = [];
  }

  StateVariableDeclaration(node: any) {
    this.globals.push(...node.variables.map((v: any) => v.name));
  }

  FunctionDefinition(node: any) {
    if (this.inInterface) {
      return;
    }

    this.arguments = node.parameters.map((p: any) => p.name);

    for (const param of node.parameters) {
      const hasLeadingUnderscore = naming.hasLeadingUnderscore(param.name);

      if (!hasLeadingUnderscore) {
        continue;
      }

      if (!this.globals.includes(param.name.slice(1))) {
        this._error(param);
      }
    }
  }

  'FunctionDefinition:exit'() {
    this.arguments = [];
  }

  VariableDeclaration(node: any) {
    if (this.inInterface) {
      return;
    }

    const hasLeadingUnderscore = naming.hasLeadingUnderscore(node.name);

    if (node.isStateVar) {
      this._checkStateVariableUnderscore(node, hasLeadingUnderscore);

      return;
    }

    if (!hasLeadingUnderscore) {
      return;
    }

    for (const argument of this.arguments) {
      // i.e. underscored argument name
      if (argument == node.name) {
        return;
      }

      // block variable has leading underscore to not shadow an argument
      if (argument == node.name.slice(1)) {
        return;
      }
    }

    for (const gVar of this.globals) {
      // i.e. underscored global variable
      if (gVar == node.name) {
        return;
      }

      // block variable has leading underscore to not shadow global variable
      if (gVar == node.name.slice(1)) {
        return;
      }
    }

    this._error(node);
  }

  // NOTE: similar thing does private-vars-leading-underscore but it doesn't take into account constants and immiutables
  _checkStateVariableUnderscore(node: any, hasLeadingUnderscore: boolean) {
    if (node.visibility == 'public') {
      if (hasLeadingUnderscore) {
        this._error(node, false);
      }
    } else {
      if (node.isDeclaredConst || node.isImmutable) {
        return;
      }

      if (!hasLeadingUnderscore) {
        this._error(node, true);
      }
    }
  }

  _error(node: any, shouldStartWithUnderscore: boolean = false) {
    this.error(node, `'${node.name}' ${shouldStartWithUnderscore ? 'should' : 'should not'} start with underscore`);
  }
}
