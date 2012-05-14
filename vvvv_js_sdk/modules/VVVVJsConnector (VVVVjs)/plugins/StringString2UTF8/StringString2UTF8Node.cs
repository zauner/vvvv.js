#region usings
using System;
using System.ComponentModel.Composition;

using VVVV.PluginInterfaces.V1;
using VVVV.PluginInterfaces.V2;
using VVVV.Utils.VColor;
using VVVV.Utils.VMath;

using VVVV.Core.Logging;
#endregion usings

namespace VVVV.Nodes
{
	#region PluginInfo
	[PluginInfo(Name = "String2UTF8", Category = "String", Help = "Basic template with one string in/out", Tags = "")]
	#endregion PluginInfo
	public class StringString2UTF8Node : IPluginEvaluate
	{
		#region fields & pins
		[Input("Input", DefaultString = "hello c#")]
		ISpread<string> FInput;

		[Output("Output")]
		ISpread<int> FOutput;

		[Import()]
		ILogger FLogger;
		#endregion fields & pins

		//called when data for any output pin is requested
		public void Evaluate(int SpreadMax)
		{
		    byte[] bytes = System.Text.Encoding.UTF8.GetBytes(FInput[0]);
			FOutput.SliceCount = bytes.Length;
			for (int i=0; i<bytes.Length; i++)
			{
				FOutput[i] = System.Convert.ToInt16(bytes[i]);
			}

			//FLogger.Log(LogType.Debug, "Logging to Renderer (TTY)");
		}
	}
}
