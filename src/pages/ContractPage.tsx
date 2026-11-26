import { ContractCheck } from '../components/tools/ContractCheck';
import { BackToTools } from '../components/ui/BackToTools';
import { ToolHeader } from '../components/ui/ToolHeader';

/** Contract check lives under Tools. */
export function ContractPage() {
  return (
    <section>
      <BackToTools />
      <ToolHeader
        title="Contract check"
        description="Add a contract and see which parts to worry about. Read on your device first; AI review is optional."
      />
      <ContractCheck />
    </section>
  );
}
