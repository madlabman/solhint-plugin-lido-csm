import BaseChecker from 'solhint/lib/rules/base-checker';
import { isCamelCase } from 'solhint/lib/common/identifier-naming';

const ruleId = 'enum-name-camelcase';
const meta = {
  type: 'naming',
  docs: {
    description: 'Enums name should be in CamelCase.',
    category: 'Style Guide Rules',
  },
  isDefault: true,
  recommended: true,
  defaultSetup: 'warn',
  schema: [],
};

export class EnumNameCamelCaseChecker extends BaseChecker implements Rule {
  constructor(reporter: any) {
    super(reporter, ruleId, meta);
  }

  EnumDefinition(node: any) {
    if (!isCamelCase(node.name)) {
      this.error(node, `Enum name '${node.name}' must be in CamelCase`);
    }
  }
}
